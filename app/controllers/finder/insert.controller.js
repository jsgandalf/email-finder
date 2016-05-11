var Proxy = require('../../models/proxy');
var PrivateProxy = require('../../models/privateProxies');
var privateProxies = require('../../../config/privateProxies');
var _ = require('lodash');
var Bluebird = require('bluebird');
var config = require('../../../config/config');

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
      provider: 'ovh',
      username: config.privateProxyUsername,
      password: config.privateProxyPassword
    }
  });

  massInsert(newprox).then(function(data){
    return res.send(200);
  }, function(err){
    console.log(err);
    res.send(500);
  });
};
