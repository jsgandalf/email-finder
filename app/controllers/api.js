var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Article = mongoose.model('Article'),
  FinderCtrl = require('./finder/finder.controller')

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/guess', FinderCtrl.index);
