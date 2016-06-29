var google = require('../../google/google');
var Bluebird = require('bluebird');
var _ = require('lodash');

google.resultsPerPage = 10;

function findHref(links){
  links = _.filter(links, function(link) {
    return link.href != null && link.href.match(/wikipedia/) == null && link.href.match(/linkedin/) == null;
  });
  return links[0].href;
}

function findCompanyWebsite(companyName) {
  var deferred = Bluebird.pending();

  var ip = "37.48.125.203";
  var port = 222;
  var username = "bryson";
  var password = "Wayne1!!!";


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
