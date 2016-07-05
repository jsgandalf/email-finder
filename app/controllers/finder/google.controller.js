var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');
var mppProxies = require('../../../config/mppProxies.js');

google.resultsPerPage = 10;


exports.findCompanyWebsite = findCompanyWebsite;

function findHref(links){
  links = _.filter(links, function(link) {
    return link.href != null && link.href.match(/wikipedia/) == null && link.href.match(/linkedin/) == null;
  });
  return links[0].href;
}

function getProxy(){
  var totalProxies = 7;

  return mppProxies[Math.floor((Math.random() * (totalProxies - 1)))]; //out of 8 proxies
}

function findCompanyWebsite(companyName) {
  var retry = 0;
  return tryGoogle(companyName, retry).catch(function(err) {
    console.log(err)
    retry += 1;
    if (retry < 10) {
      return tryGoogle(companyName, retry);
    }
  })


}

function tryGoogle(companyName){
  return new Bluebird(function(resolve, reject){
    var proxy = getProxy();
    /*proxy = {
      ip: "104.223.53.188",
      port: 3130,
      username: "redtango",
      password: "Gw02D56322"
    }*/
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

//findCompanyWebsite("premera blue cross");

/*
findCompanyWebsite('Inboard Action Sports').then(function(data){
  console.log(data)
}).done();
*/
