var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');
var mppProxies = require('../../../config/mppProxies.js');

google.resultsPerPage = 10;

function findHref(links){
  links = _.filter(links, function(link) {
    return link.href != null && link.href.match(/wikipedia/) == null && link.href.match(/linkedin/) == null;
  });
  return links[0].href;
}

function getProxy(){
  //158.222.4.208:80:test_3:dog
  //209.222.100.171:80:test_3:dog
  /*var ip = "209.222.100.171";
   var port = 80;
   var username = "test_3";
   var password = "dog";*/

  return mppProxies[Math.floor((Math.random() * 5))]; //out of 6 proxies
}

function findCompanyWebsite(companyName) {
  var deferred = Bluebird.pending();
  var proxy = getProxy();



  var ip = proxy.ip;
  var port = proxy.port;
  var username = proxy.username;
  var password = proxy.password;

  var retry = 0;
  return tryGoogle(companyName, retry).catch(function() {
    retry += 1;
    if (retry < 3) {
      return tryGoogle(companyName, retry);
    }
  })


}

function tryGoogle(companyName){
  return new Bluebird(function(resolve, reject){
    var proxy = getProxy();
    google(proxy.username, proxy.password, proxy.ip, proxy.port, companyName, function (err, res) {
      if (err) {
        reject(err);
      } else if (res.links.length < 1) {
        reject('Could not find domain name for this company in google');
      } else {
        href = findHref(res.links);
        console.log(href)
        resolve(href);
      }
    });
  });
}

findCompanyWebsite("amplitude");

exports.findCompanyWebsite = findCompanyWebsite;

/*
findCompanyWebsite('Inboard Action Sports').then(function(data){
  console.log(data)
}).done();
*/
