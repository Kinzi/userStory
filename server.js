var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var config = require('./config');
var mongoose = require('mongoose');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//Connect DB
mongoose.connect(config.database, function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Connected to db');
	}
});

//Set up App
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(express.static(__dirname +'/public'));

//Set up API Route
var api = require('./app/routes/api')(app, express, io);
app.use('/api', api);

//Return index.html
app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/app/views/index.html');
});

//Start server
http.listen(config.port, function(err){
	if(err) {
		console.log(err);
	} else {
		console.log("Listening to Port " + config.port);
	}
});