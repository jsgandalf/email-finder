var google = require('../../google/google');
var Bluebird = require('bluebird');

//var emailAccounts = require('../../config/emailAccounts');
var emailAccounts = require('../../../config/emailAccounts');

google.resultsPerPage = 1;

function findCompanyWebsite(companyName) {
  var deferred = Bluebird.pending();
  var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];
  var proxyArry = emailAccount.proxy.split(":");
  var ip = proxyArry[0];
  var port = proxyArry[1];
  var username = proxyArry[2];
  var password = proxyArry[3];

  google(username, password, ip, port, companyName, function (err, res) {
    if (err)
      deferred.reject(err);
    else
      deferred.resolve(res.links[0].href);
  })
  return deferred.promise;
}

exports.findCompanyWebsite = findCompanyWebsite;

/*
findCompanyWebsite('Inboard Action Sports').then(function(data){
  console.log(data)
}).done();
*/
