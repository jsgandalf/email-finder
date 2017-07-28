var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');
var mppProxies = require('../../../config/mppProxies.js');
var cancelSome = require('../../utils/cancel-some');

google.resultsPerPage = 10;


exports.findCompanyWebsite = findCompanyWebsite;
exports.tryGoogle = tryGoogle;

function findHref(links){
  links = _.filter(links, function(link) {
    return link.href != null && link.href.match(/wikipedia/) == null && link.href.match(/linkedin/) == null;
  });
  return links[0].href;
}

function getProxy(){
  var totalProxies = mppProxies.length;

  return mppProxies[Math.floor((Math.random() * (totalProxies - 1)))]; //out of 8 proxies
}

function findCompanyWebsite(companyName, retry) {
  if(typeof retry == 'undefined' || retry == null){
    retry = 0;
  }
  var proxy = {
    ip: "108.59.14.203",
    port: 13041,
    username: null,
    password: null
  }
  /*return tryGoogle(companyName).then(function(data){
    return data
  }).catch(function(err) {
    retry += 1;
    if (retry < 2) {
      return findCompanyWebsite(companyName, retry);
    }
  });*/
  return cancelSome.getFirst([
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy),
    tryGoogle(companyName,proxy)
  ]).then(function (data) {
    console.log(data)
    return data;
  }).catch(function(err) {
    console.log('retry')
    retry += 1;
    if (retry < 2) {
      return findCompanyWebsite(companyName, retry);
    }
  });
}

/*function findCompanyWebsite(companyName, retry) {
  if(typeof retry == 'undefined' || retry == null){
    retry = 0;
  }
  return tryGoogle(companyName).catch(function(err) {
    retry += 1;
    if (retry < 10) {
      return findCompanyWebsite(companyName, retry);
    }
  });
}*/

/*
 var proxy = {
 ip: "108.59.14.208",
 port: 13010,
 username: null,
 password: null
 }
 */

function tryGoogle(companyName, proxy){
  return new Bluebird(function(resolve, reject, onCancel){
    if(typeof proxy == 'undefined' || proxy == null) {
      proxy = getProxy();
    }
    var aborter = google(proxy.username, proxy.password, proxy.ip, proxy.port, companyName, function (err, res) {
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
    onCancel(aborter);
  });
}

/*
findCompanyWebsite('Inboard Action Sports').then(function(data){
  console.log(data)
}).done();
*/
