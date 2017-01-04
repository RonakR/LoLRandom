var express = require('express');
var app = express();
var request = require('request');
var mongoose = require('mongoose');
var _ = require('underscore');
var fs = require('fs');
var bodyParser = require('body-parser');
var session = require('express-session');
//Keys should be in a config file
var riotAPIKey = "83d42fea-41fb-4688-be17-7bf6b7b80c0d"
var championGGKey = "4442f8cded7a71423321527a8391ef79";

mongoose.connect('mongodb://localhost/lolrandom');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(session({	cookie: {maxAge: 60000},
									secret: 'api',
									resave: false,
									saveUninitialized: false}));

//Champion Model in Mongo
var Champion = mongoose.model('Champion', {
	tags: Array,
	laneInfo: Array,
	name: String
});

//Populates the db by hitting riot's api.
app.get('/api/riotTags', function(req, res) {
	//Version number in config
	request('https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=tags&api_key=' + riotAPIKey, function(err, response, body) {
		if (err) return console.log(err);
		// createDataFromBody(body.data);
		// console.log(body);
		data = JSON.parse(body);
		populateFromData(data.data);
	});
	res.send("success");
});

var populateFromData = function(data){
	//ONLY ADDS RIGHT NOW
	//needs to update existing ones
	_.each(data, function(element, index, list){

		var allTags = [];
		var getMoreChampionDataPromise = getMoreChampionData(index);
		var addToMongoPromise
		var getChampionImagePromise
		getMoreChampionDataPromise.then(function(data){
			allTags = _.union(data.tags, element.tags);
			addToMongoPromise = addToMongo(allTags, data.laneInfo, index);
			getChampionImagePromise = getChampionImage(index);
		})

		Promise.all([addToMongoPromise, getChampionImagePromise]).catch(function(err){
			throw err;
		})
	});
	console.log("added/updated");
};

//Populats more tags from champoin.gg's api
var getMoreChampionData = function(championName){
	var retObj = {
		tags: [],
		laneInfo: []
	};

	return new Promise(function(resolve, reject){
		request('http://api.champion.gg/champion/' + championName + '?api_key='+championGGKey, function(err, response, body){
			if(err) {
				console.log(err);
				reject(err);
			}
			data = JSON.parse(body);

			_.each(data, function(element, index, list){
				//dmgComposition
				var damageType = element.dmgComposition.magicDmg > element.dmgComposition.physicalDmg ? 'Magic' : 'Physical';
				if (!_.contains(retObj.tags, damageType)) {
					retObj.tags.push(damageType);
				}
				//lanes
				retObj.tags.push(element.role);
				//laneInfo
				var laneInfoObj = createLaneInfoObj(element.patchWin, element.patchPlay);
				var obj = {};
				obj[element.role] = laneInfoObj;
				retObj.laneInfo.push(obj);
			});

			resolve(retObj);
		});
	});
};

var createLaneInfoObj = function(patchWin, patchPlay){
	return {
		"patchWin": patchWin[patchWin.length-1] > patchWin[patchWin.length-2] ? 'UP' : 'DOWN',
		"patchPlay": patchPlay[patchPlay.length-1] > patchPlay[patchPlay.length-2] ? 'UP' : 'DOWN'
	}
}

var addToMongo = function(allTags, laneInformation, index){
	return Champion.create({
		tags: allTags,
		laneInfo: laneInformation,
		name: index
	});
}

var getChampionImage = function(championName){

	return new Promise(function(resolve, reject){
		var championNamePng = championName + ".png";
		//Make patch number configurat
		request("http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/"+championNamePng)
		.on('error', function(err){
			console.log(err);
			reject(err);
		})
		.pipe(fs.createWriteStream("./public/images/"+championNamePng));
		resolve("saved");
	});
};
app.post('/api/championsByRoles', function(req, res){
	Champion.find(
		{tags: { $all: req.body}},
 		function(err, champs){
 			res.send(champs);
 		}
 	);
});

app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/');
});

app.listen(8080);
console.log("App listening on port 8080");
