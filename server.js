const _ = require('underscore');
const bodyParser = require('body-parser');
const config = require('./config.json');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const request = require('request');
const session = require('express-session');
const winston = require('winston');

const riotAPIKey = config.riotAPIKey;
const championGGKey = config.championGGKey;

const app = express();
winston.level = config.env === 'prod' ? 'error' : 'debug';

mongoose.connect('mongodb://localhost/lolrandom');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: 'true' }));           // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(session({ cookie: { maxAge: 60000 }, secret: 'api', resave: false, saveUninitialized: false }));

// Champion Model in Mongo
const Champion = mongoose.model('Champion', {
  tags: Array,
  laneInfo: Array,
  name: String,
});

function createLaneInfoObj(patchWin, patchPlay) {
  return {
    patchWin: patchWin[patchWin.length - 1] > patchWin[patchWin.length - 2] ? 'UP' : 'DOWN',
    patchPlay: patchPlay[patchPlay.length - 1] > patchPlay[patchPlay.length - 2] ? 'UP' : 'DOWN',
  };
}

// Populats more tags from champoin.gg's api
function getMoreChampionData(championName) {
  const retObj = {
    tags: [],
    laneInfo: [],
  };

  return new Promise((resolve, reject) => {
    request(`http://api.champion.gg/champion/${championName}?api_key=${championGGKey}`, (err, response, body) => {
      if (err) {
        winston.error(err);
        reject(err);
      }
      const data = JSON.parse(body);

      _.each(data, (element) => {
        // dmgComposition
        const damageType = element.dmgComposition.magicDmg > element.dmgComposition.physicalDmg ? 'Magic' : 'Physical';
        if (!_.contains(retObj.tags, damageType)) {
          retObj.tags.push(damageType);
        }
        // lanes
        retObj.tags.push(element.role);
        // laneInfo
        const laneInfoObj = createLaneInfoObj(element.patchWin, element.patchPlay);
        const obj = {};
        obj[element.role] = laneInfoObj;
        retObj.laneInfo.push(obj);
      });

      resolve(retObj);
    });
  });
}


function addToMongo(allTags, laneInformation, index) {
  return Champion.create({
    tags: allTags,
    laneInfo: laneInformation,
    name: index,
  });
}

function getChampionImage(championName) {
  return new Promise((resolve, reject) => {
    const championNamePng = `${championName}.png`;
    // Make patch number configurat
    request(`http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/${championNamePng}`)
    .on('error', (err) => {
      winston.error(err);
      reject(err);
    })
    .pipe(fs.createWriteStream(`./public/images/${championNamePng}`));
    resolve('saved');
  });
}

function populateFromData(data) {
  // ONLY ADDS RIGHT NOW
  // needs to update existing ones
  _.each(data, (element, index) => {
    let allTags = [];
    const getMoreChampionDataPromise = getMoreChampionData(index);
    let addToMongoPromise;
    let getChampionImagePromise;
    getMoreChampionDataPromise.then((championData) => {
      allTags = _.union(championData.tags, element.tags);
      addToMongoPromise = addToMongo(allTags, data.laneInfo, index);
      getChampionImagePromise = getChampionImage(index);
    });

    Promise.all([addToMongoPromise, getChampionImagePromise]).catch((err) => {
      throw err;
    });
  });
  winston.debug('added/updated');
}

// Populates the db by hitting riot's api.
app.get('/api/riotTags', (req, res) => {
  // Version number in config
  const championDataUrl = `https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=tags&api_key=${riotAPIKey}`;
  request(championDataUrl, (err, response, body) => {
    if (err) throw err;
    const data = JSON.parse(body);
    populateFromData(data.data);
  });
  res.send('success');
});

app.post('/api/championsByRoles', (req, res) => {
  Champion.find(
    { tags: { $all: req.body } },
    (err, champs) => {
      if (err) throw err;
      res.send(champs);
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/'));
});

app.listen(config.appPort);
winston.debug('App listening on port 8080');
