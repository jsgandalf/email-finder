var Bluebird = require('bluebird');
var Q = require('q');
var dns = require('dns');
var _ = require('lodash');
var net = require('net');
var emailAccounts = require('../../../config/emailAccounts');
var proxies = require('../../../config/proxies');
var premiumPublicProxies = require('../../../config/premiumPublicProxies');
var request = require('request');
var Socks = require('socks');
var GoogleCtrl = require('./google.controller');
var Proxy = require('../../models/proxy');
var emailController = require('../email/email.controller');
var config = require('../../../config/config');
var moment = require('moment');

exports.removeOldProxies = function(req, res){
  var today = new Date();
  today.setDate(today.getDate()-1);
  return Proxy.remove({ created: { $lte: today }}).exec().then(function(){
    return res.send(200);
  }, function(){
    return res.send(500);
  });
};
