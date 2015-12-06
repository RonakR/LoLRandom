var express = require('express');
var app = express();
var request = require('request');

app.get('/api/riotTags', function(req, res) {
	request('https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=tags&api_key=83d42fea-41fb-4688-be17-7bf6b7b80c0d', function(err, response, body) {
		if (!err) console.log(body);
		else console.log(err);
	});
});



app.listen(8080);
console.log("App listening on port 8080");