var express = require('express'),
  router = express.Router(),
  FinderCtrl = require('./finder/finder.controller'),
  SearchCtrl = require('./search/search.controller'),
  auth = require('./components/auth/auth.service');

module.exports = function (app) {
  app.use('/api', router);
};

router.get('/v1/guess', auth.isAuthenticated(), FinderCtrl.index);

router.get('/v1/search', auth.isAuthenticated(), SearchCtrl.index);

//http://localhost:3000/api/v1/guess?key=UZE6pY5Yz6z3ektV:NEgYhceNtJaee3ga:H5TYvG57F2dzJF7Ginvalidate&first=john&last=Johnson&domain=premera.com

router.get('/*', function (req, res, next) {
  res.send(403); //res.render('index', { title: 'Generator-Express MVC' });
});
