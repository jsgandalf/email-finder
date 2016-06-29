var Proxy = require('../../models/proxy');
var request = require('request');
var _ = require('lodash');
var Bluebird = require('bluebird');
var config = require('../../../config/config');
var ProxyTest = require('./test.controller');


function massInsert(data){
  return new Bluebird(function(resolve, reject) {
    Proxy.collection.insert(data, { ordered: false }, function(err, info){
      if(err){
        reject(err);
      }else{
        resolve(true)
      }
    });
  })
}

exports.refreshProxies = function(req, res){
  Bluebird.promisify(request.get)('http://list.didsoft.com/get?type=socks&premium=yes&email=messagesumo@gmail.com&pass=fhwrv7&showcountry=no').then(function(results){
    var proxies = results.body.split('\n');
    //console.log(proxies)
    return _.filter(proxies, function(proxy) {
      return (typeof proxy != 'undefined' && proxy != '');
    }).map(function(proxy){
      var split = proxy.split(':');
      //console.log(split[1])
      var split2 = split[1].split('#');
      return {
        ip: split[0],
        port: parseInt(split2[0]),
        type: parseInt(split2[1].replace('socks', '')),
        rnd: Math.random(),
        created: new Date(),
        isDead: false,
        private: false
      }
    });
  }).then(function(data){
    //have all the
    //return massInsert(data);
    //Look for duplicates in the database.

    return massInsert(data);

    /*return reflectMap(data, function(proxy){
      return Proxy.findOne({ ip: proxy.ip, port: proxy.port }).then(function(data){
        if(typeof data == 'undefined' || data == null ) {
          proxy.rnd = Math.random();
          proxy.isDead = false;
          return Proxy.create(proxy);
        }
      });
    });*/
  }).then(function() {
    return ProxyTest.test();
  }).then(function(){
    res.send(200);
  }).catch(function(err){
    //console.log(err);
    res.send(200);
  });
};

function reflectMap(collection, fn) {
  var concurrency = 15;
  return Bluebird.map(collection, function(val) {
    return Bluebird.try(function() {
      return fn(val);
    }).then(null, function(error) {
      console.log('error in reflect map', error, error.stack);
    });
  }, {concurrency: concurrency});
}
