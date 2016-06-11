var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');
//var emailAccounts = require('../../config/emailAccounts');
var emailAccounts = require('../../../config/emailAccounts');

google.resultsPerPage = 10;

function findHref(links){
  links = _.filter(links, function(link) {
    return link.href != null && link.href.match(/wikipedia/) == null && link.href.match(/linkedin/) == null;
  });
  return links[0].href;
}

function findCompanyWebsite(companyName) {
  var deferred = Bluebird.pending();
  var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];
  /*var proxyArry = emailAccount.proxy.split(":");
  var ip = proxyArry[0];
  var port = proxyArry[1];
  var username = proxyArry[2];
  var password = proxyArry[3];*/

   var ip = "23.106.208.186";
   var port = 29842;
   var username = "sthoma";
   var password = "TnVDp4Zy";


  google(username, password, ip, port, companyName, function (err, res) {
    if (err) {
      deferred.reject(err);
    } else if(res.links.length < 1) {
      deferred.reject('Could not find domain name for this company in google');
    } else {
      href = findHref(res.links);
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
