var express = require('express'),
  router = express.Router(),
  FinderCtrl = require('./finder/finder.controller'),
  InsertCtrl = require('./finder/insert.controller'),
  RemoveCtrl = require('./finder/remove.controller'),
  TestCtrl = require('./proxy/test.controller'),
  auth = require('./components/auth/auth.service');

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/guess', auth.isAuthenticated(), FinderCtrl.index);

router.get('/insert', InsertCtrl.insertProxies);

router.get('/clean', RemoveCtrl.removeOldProxies);

router.get('/test', TestCtrl.test);

/*router.get('/testPrivate', TestCtrl.testPrivate);*/
