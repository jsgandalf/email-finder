var express = require('express'),
  router = express.Router(),
  ProxyCtrl = require('./proxy/proxy.controller');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/refreshProxy', ProxyCtrl.refreshProxies);

/*router.get('/', function (req, res, next) {
  Article.find(function (err, articles) {
    if (err) return next(err);
    res.render('index', {
      title: 'Generator-Express MVC',
      articles: articles
    });
  });
});*/
