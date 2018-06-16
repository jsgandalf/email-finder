

var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  emailController = require('./app/controllers/email/email.controller');
  require('bluebird').config({
    cancellation: true
  });

mongoose.connect(config.db);
var db = mongoose.connection;
config.db = db;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
var app = express();

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  console.log(err.stack);
  if(process.env.NODE_ENV == 'production') {
    emailController.errorMessage(err);
  }
});

require('./config/express')(app, config);

app.listen(process.env.PORT || config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

//npm start

