var express = require('express'),
  router = express.Router(),
  FinderCtrl = require('./finder/finder.controller');

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/guess', FinderCtrl.index);
