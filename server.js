var express = require('express');
var app = express();
var request = require('request');
var mongoose = require('mongoose');
var _ = require('underscore');
var fs = require('fs');
var bodyParser = require('body-parser');
var riotAPIKey = "83d42fea-41fb-4688-be17-7bf6b7b80c0d"
var championGGKey = "4442f8cded7a71423321527a8391ef79";

mongoose.connect('mongodb://localhost/lolrandom');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

//Champion Model in Mongo
var Champion = mongoose.model('Champion', {
	tags: Array,
	name: String
});

//Populates the db by hitting riot's api.
app.get('/api/riotTags', function(req, res) {
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
		var addToMongoPromise = addToMongo(element, index);
		addToMongoPromise.then(function(champ){
			console.log("in prom");
		});

		console.log("before");
		getChampionImage(index);
		console.log("after");
	});
	console.log("added/updated");
};

var addToMongo = function(element, index){
	return Champion.create({
		tags: element.tags,
		name: index
	});
}

var getChampionImage = function(championName){
		console.log("just in");
		var championNamePng = championName + ".png";
		request("http://ddragon.leagueoflegends.com/cdn/6.4.2/img/champion/"+championNamePng)
		.pipe(fs.createWriteStream("./public/images/"+championNamePng));
		console.log("just out");
};

//Populats more tags from champoin.gg's api
app.get("/api/championTags", function(req, res){
	request('http://api.champion.gg/champion/corki?api_key='+championGGKey, function(err, response, body){
		if(err) return console.log(err);

		data = JSON.parse(body);
		console.log(data);
	});
	res.send("success");
});

app.post('/api/championsByRoles', function(req, res){
	Champion.find(
		{tags: { $all: req.body}},
		function(err, champs){
			res.send(champs);
		}
	);
});

app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.listen(8080);
console.log("App listening on port 8080");