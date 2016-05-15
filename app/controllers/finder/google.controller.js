var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');
//var emailAccounts = require('../../config/emailAccounts');
var emailAccounts = require('../../../config/emailAccounts');

google.resultsPerPage = 10;

function findHref(links){
  links = _.filter(links, function(link) {
   return link.href != null
  });
  return links[0].href;
}

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
    else{
      console.log(res.links)
      var href = res.links[0].href;
      if(href == null){
        href = findHref(res.links);
      }
      console.log(href);
      deferred.resolve(href);
    }
  });
  return deferred.promise;
}

exports.findCompanyWebsite = findCompanyWebsite;

/*
findCompanyWebsite('Inboard Action Sports').then(function(data){
  console.log(data)
}).done();
*/
