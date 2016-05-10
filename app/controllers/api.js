var express = require('express'),
  router = express.Router(),
  FinderCtrl = require('./finder/finder.controller'),
  ProxyCtrl = require('./finder/proxy.controller'),
  auth = require('./components/auth/auth.service');

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/guess', auth.isAuthenticated(), FinderCtrl.index);

router.get('/insert', FinderCtrl.insertProxies);

router.get('/clean', ProxyCtrl.removeOldProxies);
