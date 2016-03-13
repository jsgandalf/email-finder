var PythonShell = require('python-shell');
var Bluebird = require('bluebird');
var dns = require('dns');
var _ = require('lodash')

// Get list of accounts
exports.index = function(req, res) {
  console.log(req.query.domain)
  if(typeof req.query.domain == 'undefined' || req.query.domain == ''){
    return res.status(500).json({ err: 'domain required'});
  } else if(typeof req.query.first == 'undefined' || req.query.first == ''){
    return res.status(500).json({ err: 'first name required'});
  } else if(typeof req.query.last == 'undefined' || req.query.last == ''){
    return res.status(500).json({ err: 'last name required'});
  } else {
    Bluebird.promisify(dns.resolveMx)(req.query.domain).then(function (mxServers) {
      var sorted = _.sortBy(mxServers, 'priority');
      if(sorted.length > 0 && typeof sorted[0] != 'undefined'){
        return res.json({err: 'Could not find email'});
      }else{
        var mxRecord = sorted[0];
      }
      // Prints: localhost ssh
    }).catch(function (err) {
      console.log(err);
      return res.json({err: err});
    });
  }
};
