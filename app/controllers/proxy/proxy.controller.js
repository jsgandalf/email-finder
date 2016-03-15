var Proxy = require('../../models/proxy');
var request = require('request');
var _ = require('lodash');
var Bluebird = require('bluebird');
var config = require('../../../config/config');

/*function massInsert(data){
  return new Bluebird(function(resolve, reject) {
    Proxy.collection.insert(data, function(err, info){
      if(err){
        reject(err);
      }else{
        resolve(true)
      }
    });
  })
}*/

exports.refreshProxies = function(req, res){
  Bluebird.promisify(request.get)('http://list.didsoft.com/get?type=socks&premium=yes&email=messagesumo@gmail.com&pass=jfjfnm&showcountry=no').then(function(results){
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
        type: parseInt(split2[1].replace('socks', ''))
      }
    });
  }).then(function(data){
    //return massInsert(data);
    return reflectMap(data, function(proxy){
      return Proxy.findOne({ ip: proxy.ip, port: proxy.port }).then(function(data){
        if(typeof data == 'undefined' || data == null ) {
          proxy.rnd = Math.random();
          proxy.isDead = false;
          return Proxy.create(proxy);
        }
      });
    });
  }).then(function(){
    res.send(200);
  }).catch(function(err){
    console.log(err)
  });
};

function reflectMap(collection, fn) {
  var concurrency = 10;
  return Bluebird.map(collection, function(val) {
    return Bluebird.try(function() {
      return fn(val);
    }).then(null, function(error) {
      console.log('error in reflect map', error, error.stack);
    });
  }, {concurrency: concurrency});
}
