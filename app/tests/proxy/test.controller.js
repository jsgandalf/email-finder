var Socks = require('socks');
var Bluebird = require('bluebird');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSocketConnection(ip, port, type, username, password) {
  console.log('entering promise')
  return new Bluebird(function (resolve, reject) {
    type = type || 5;
    var proxy = {
      ip: ip,
      port: port,
      type: type
    };

    /*var host = [
      "www.yahoo.com",
      "www.google.com",
      "www.ebay.com"
    ];*/


    var options = {
      proxy: {
        ipaddress: proxy.ip, // Random public proxy
        port: proxy.port,
        type: proxy.type // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
      },
      target: {
        host: "12.170.57.14", //host[getRandomInt(0,2)], // can be an ip address or domain (4a and 5 only)
        port: 25
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


/*
return createSocketConnection('37.58.52.8', '222', 5).catch(function(err){
  console.log(err);
});
*/
