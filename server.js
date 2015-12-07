var express = require('express');
var app = express();
var request = require('request');
var mongoose = require('mongoose');
var _ = require('underscore');
var fs = require('fs');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/lolrandom');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

var Champion = mongoose.model('Champion', {
	tags: Array,
	name: String
});

app.get('/api/riotTags', function(req, res) {
	request('https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=tags&api_key=83d42fea-41fb-4688-be17-7bf6b7b80c0d', function(err, response, body) {
		if (err) return console.log(err);
		// createDataFromBody(body.data);
		// console.log(body);
		data = JSON.parse(body);
		addDataToMongo(data.data);
	});
	res.send("success");
});

var addDataToMongo = function(data){
	_.each(data, function(element, index, list){
		Champion.create({
			tags : element.tags,
			name : index
		});
		getChampionImage(index);
	});
	console.log("added/updated");
};

var getChampionImage = function(championName){
	var championNamePng = championName + ".png";
	request("http://ddragon.leagueoflegends.com/cdn/5.23.1/img/champion/"+championNamePng)
		.pipe(fs.createWriteStream("./public/images/"+championNamePng));
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
	res.sendFile(__dirname + '/public/index.html');
});

app.listen(8080);
console.log("App listening on port 8080");