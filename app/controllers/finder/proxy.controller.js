var Proxy = require('../../models/proxy');
var PrivateProxy = require('../../models/privateProxies');
var privateProxies = require('../../../config/privateProxies');
var _ = require('lodash');
var Bluebird = require('bluebird');

function massInsert(data) {
  console.log('inserting')
  return new Bluebird(function(resolve, reject) {
    PrivateProxy.collection.insert(data, { ordered: false }, function(err, info) {
      if(err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  })
}

exports.insertProxies = function(req, res){
  var newprox = _.map(privateProxies, function(data){
    return {
      ip: data,
      port: 18280,
      type: 5,
      rnd: Math.random(),
      created: new Date(),
      isDead: false,
      provider: 'ovh'
    }
  });

  massInsert(newprox).then(function(data){
    return res.send(200);
  }, function(err){
    console.log(err);
    res.send(500);
  });
};

exports.removeOldProxies = function(req, res){
  var today = new Date();
  today.setDate(today.getDate()-1);
  return Proxy.remove({ created: { $lte: today }}).exec().then(function(){
    return res.send(200);
  }, function(){
    return res.send(500);
  });
};

