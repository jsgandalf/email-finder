var Socks = require('socks');
var config = require('../../../config/config');
var privateProxies = require('../../../config/privateProxies');
var Bluebird = require('bluebird');
var Proxy = require('../../models/proxy');
var PrivateProxy = require('../../models/privateProxies');
var reflectMap = require('../../utils/reflect-map');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSocketConnection(ip, port, type, username, password) {
  console.log('entering promise')
  return new Promise(function (resolve, reject) {
    type = type || 5;
    var proxy = {
      ip: ip,
      port: port,
      type: type
    };

    var host = [
      "www.yahoo.com",
      "www.google.com",
      "www.ebay.com"
    ];


    var options = {
      proxy: {
        ipaddress: proxy.ip, // Random public proxy
        port: proxy.port,
        type: proxy.type // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
      },
      target: {
        host: host[getRandomInt(0,2)], // can be an ip address or domain (4a and 5 only)
        port: 80
      },
      command: 'connect'  // This defaults to connect, so it's optional if you're not using BIND or Associate.
    };

    if(typeof username != 'undefined' && username != null && typeof password != 'undefined' && password != null ) {
      options.proxy.authentication = {
        username: username,
        password: password
      }
    }

    Socks.createConnection(options, function (err, socket, info) {
      if (err) {
        console.log('failed to connect to ' + proxy.ip);
        console.log(err);
        reject('failed to connect');
      } else {
        console.log('success')
        resolve(true);
        socket.on('error', function (err) {
          reject(err);
          socket.destroy();
        });
        // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
        socket.resume();
      }
    });
  });
}

/*createSocketConnection("149.56.157.240", 18280, 5, config.privateProxyUsername, config.privateProxyPassword).then(function(data){
  console.log(data);
}).catch(function(err){
  console.log(err);
});*/

exports.test = function() {
  return Proxy.find({ isDead: false }).exec().then(function (proxies) {
    return reflectMap(proxies, function (proxy) {
      return createSocketConnection(proxy.ip, proxy.port, proxy.type).catch(function(err){
        //mark as dead.
        return Proxy.update({ _id: proxy._id}, { $set: { isDead: true }}).exec();
      });
    }, 10);
  });
};

return createSocketConnection('37.58.52.8', '222', 5, 'st362', 'vikings123!@#').catch(function(err){
  console.log(err);
});


exports.testPrivate = function() {
  return createSocketConnection('37.58.52.8', '222', 5, 'st362', 'vikings123!@#').catch(function(err){
    console.log(err);
  });
  /*return PrivateProxy.find({ isDead: false }).exec().then(function (proxies) {
    return reflectMap(proxies, function (proxy) {
      return createSocketConnection(proxy.ip, proxy.port, 5, config.privateProxyUsername, config.privateProxyPassword).catch(function(err){
        //mark as dead.
        return PrivateProxy.update({ _id: proxy._id}, { $set: { isDead: true }}).exec();
      });
    }, 1);
  });*/
};

