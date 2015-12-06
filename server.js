var express = require('express');
var app = express();
var request = require('request');
var mongoose = require('mongoose');
var _ = require('underscore');

mongoose.connect('mongodb://localhost/lolrandom');

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
		_.each(data.data, function(element, index, list){
			Champion.create({
				tags : element.tags,
				name : index
			});
		});
	});
	res.send("success");
});

var createDataFromBody = function(champions){
	console.log("here");
	_.each(champions, function(element, index, list){
		console.log(element);
	});
	// for champion in body.data{
	// 	console.log(champion);
	// }
}


app.listen(8080);
console.log("App listening on port 8080");