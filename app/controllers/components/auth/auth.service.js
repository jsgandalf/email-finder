var config = require('../../../../config/config');
var compose = require('composable-middleware');
var _ = require('lodash');

exports.isAuthenticated = isAuthenticated;
exports.isAuthenticatedSearch = isAuthenticatedSearch;

function isAuthenticated() {
  return compose()
  // Validate apiToken
  .use(function(req, res, next) {
    // allow access_token to be passed through query parameter as well
    if(req.query.key != config.apiKey) {
      return res.status(500).json({ err: 'api key required'});
    } else if(typeof req.query.domain == 'undefined' || req.query.domain == '') {
      return res.status(500).json({ err: 'domain required'});
    } else if(typeof req.query.first == 'undefined' || req.query.first == '') {
      return res.status(500).json({ err: 'first name required'});
    } else if(typeof req.query.last == 'undefined' || req.query.last == '') {
      return res.status(500).json({ err: 'last name required'});
    } else {
      next();
    }
  })
}

function isAuthenticatedSearch() {
  return compose()
  // Validate apiToken
    .use(function (req, res, next) {
      // allow access_token to be passed through query parameter as well
      if (req.query.key != config.apiKey) {
        return res.status(500).json({err: 'api key required'});
      } else {
        next();
      }
    });
}
