var express = require('express'),
  router = express.Router(),
  FinderCtrl = require('./finder/finder.controller'),
  auth = require('./components/auth/auth.service');

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/guess', auth.isAuthenticated(), FinderCtrl.index);

router.get('/insert', FinderCtrl.insertProxies);
