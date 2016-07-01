var Bluebird = require('bluebird');
var Q = require('q');
var _ = require('lodash');
var net = require('net');
var request = require('request');
var GoogleCtrl = require('./google.controller');
var PrivateProxy = require('../../models/privateProxies');
var Lead = require('../../models/lead.model');
var emailController = require('../email/email.controller');
var config = require('../../../config/config');
var moment = require('moment');
var reflectMapWait = require('../../utils/reflect-map-wait');
var uuid = require('node-uuid');
var utils = require('./utils.controller');
var SocketCtrl = require('./socket.controller');

function verifyEmailProxyService(domain, mxRecordIp, emailToVerify, retry, provider){
  if(typeof provider == 'undefined' || provider == null){
    provider = 'ovh';
  }
  var myId = uuid.v4();
  return utils.updateRandomProxy(myId, provider).then(function(){
    return PrivateProxy.find({scriptId: myId}).exec();
  }).then(function(proxy) {
    if (proxy.length == 0 || proxy == null || typeof proxy == 'undefined') {
      return emailController.sendMessage('Problem on Messagesumo Checker', JSON.stringify(proxy)+ ' ---- '+  +'You have run out of available proxies on email checker. Check your database or increase with your proxy provider plan!  This is very bad... This means you need to get a developer looking at the messagesumo-email checker app ASAP, no questions asked.');
    }
    proxy = proxy[0];
    return SocketCtrl.createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry)
      .then(function(data) {
        return utils.unsetProxy(proxy._id).then(function() {
          return data;
        });
      }).catch(function(data){
        //console.log("there was a problem, re-running");
        return false;
        //return verifyEmailProxyService(domain, data.mxRecordIp, data.emailToVerify, data.retry, data.provider); //Retry up to 1 times with available proxies.
      });
  });
}

function guessEmail(firstName, lastName, domain){
  var patterns = [
    '{f}{last}',
    '{last}',
    '{first}',
    '{f}{f2}{last}',
    '{first}{l}',
    '{first}.{last}',
    '{first}{last}',
    '{f}{l}',
    '{first}_{last}',
    '{first}-{last}'
  ];
  var promise = Q.when(true);
  if (typeof lead != 'undefined' && lead != null && moment(lead.created).isBefore(moment().subtract(3, 'months'))) {
    //console.log('deleting cache and refreshing');
    promise = Lead.remove({ _id: lead._id }).exec();
  }
  return promise.then(function() {
    return utils.getIp(domain);
  }).then(function(data){
    var mxRecordIp = data;
    console.log(mxRecordIp)

    console.log('Verifying: ' + firstName + ' ' + lastName + ' on ' + domain);

    return reflectMapWait(patterns, function (pattern) {
      var emailPattern = pattern
        .replace('{first}', firstName)
        .replace('{last}', lastName)
        .replace('{f}', firstName.charAt(0))
        .replace('{f2}', firstName.charAt(1))
        .replace('{l}', lastName.charAt(0));
      return verifyEmailProxyService(domain, mxRecordIp, emailPattern.toLowerCase() + '@' + domain, 0, 'proxyRack');
    });
  }).then(function (verifiedEmails) {
    return utils.formatResponse(verifiedEmails, firstName, lastName, domain, patterns);
  })
}

function findCompanyUrl(domain){
  var promise = new Bluebird(function(resolve){ resolve(domain)});
  //invoke a company lookup if this is not a url.
  if (domain.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i) == null) {
    promise = GoogleCtrl.findCompanyWebsite(domain); //The Zrnich Law Group, P.C.
  }
  return promise;
}

// Find the Email
//Example: http://localhost:3000/api/v1/guess?key=UZE6pY5Yz6z3ektV:NEgYhceNtJaee3ga:H5TYvG57F2dzJF7Ginvalidate&first=James&last=Johnson&domain=godaddy.com
exports.index = function(req, res) {
  var domain = utils.purifyDomain(req.query.domain),
    firstName = utils.cleanFirst(utils.purifyName(req.query.first)).toLowerCase(),
    lastName = utils.cleanLast(utils.purifyName(req.query.last)).toLowerCase();

  findCompanyUrl(domain).then(function(data) {
    domain = utils.purifyDomain(data.toLowerCase());
    return Lead.findOne({firstName: firstName, lastName: lastName, domain: domain}).exec();
  }).then(function(lead) {
    if (typeof lead != 'undefined' && lead != null && moment(lead.created).isAfter(moment().subtract(3, 'months'))) {
      return Q.when(lead); //console.log('cached');
    } else {
      return guessEmail(firstName, lastName, domain)
    }
  }).then(function(lead) {
    return res.json(lead);
  }).catch(function (err) {
    return utils.handleError(err, res, firstName, lastName, domain);
  }).done();
};
