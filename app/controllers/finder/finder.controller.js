var Bluebird = require('bluebird');
var dns = require('dns');
var _ = require('lodash');
var net = require('net');
var emailAccounts = require('../../../config/emailAccounts');
var request = require('request');
var Socks = require('socks');

function randomStr(m) {
  var m = m || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (var i=0; i < m; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
  return s;
};

function verifyEmail(proxyIp, proxyPort, mxRecordIp, emailToVerify){
  var deferred = Bluebird.pending();
  var smtpPort = 25;
  var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];
  var options = {
    proxy: {
      ipaddress: proxyIp, // Random public proxy
      port: proxyPort,
      type: 5 // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
      //userid: username + ":" + password
      /*authentication: {
       username: username,
       password: password
       }*/
    },
    target: {
      host: mxRecordIp, // can be an ip address or domain (4a and 5 only)
      port: smtpPort
    },
    command: 'connect'  // This defaults to connect, so it's optional if you're not using BIND or Associate.
  };

  Socks.createConnection(options, function(err, socket, info) {
    if (err){
      console.log('custom error');
      console.log(err);
      deferred.reject(err);
    } else {
      console.log(info)
      // Connection has been established, we can start sending data now:
      //socket.write("GET / HTTP/1.1\nHost: google.com\n\n");
      socket.write('HELO www.' + randomStr(Math.floor((Math.random() * 10) + 4)) + '.com\r\n');
      socket.write("MAIL FROM: <"+ emailAccount.email +">\r\n");
      socket.write("rcpt to:<" + emailToVerify + ">\r\n");
      socket.on('data', function(data) {
        data = data.toString("utf-8", 0, 12);
        if(data.toString().match(/250/i) != null) {
          //console.log('final check OK email valid.');
          deferred.resolve(true);
          socket.destroy();
        } else if(data.toString().match(/220/i) != null) {
          //console.log('email valid');
        } else {
          deferred.reject('Email not valid');
          //console.log('email not valid');
          socket.destroy();
        }
      });
      socket.on('close', function () {
        console.log('Client disconnected from proxy');
      });

      socket.on('error', function (err) {
        deferred.reject('Email not valid');
        console.log('Error: ' + err.toString());
      });

      // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
      socket.resume();

      // 569
      // <Buffer 48 54 54 50 2f 31 2e 31 20 33 30 31 20 4d 6f 76 65 64 20 50 65...
    }
  });
  return deferred.promise;
}


// Get list of accounts
exports.index = function(req, res) {
  if(typeof req.query.domain == 'undefined' || req.query.domain == ''){
    return res.status(500).json({ err: 'domain required'});
  } else if(typeof req.query.first == 'undefined' || req.query.first == ''){
    return res.status(500).json({ err: 'first name required'});
  } else if(typeof req.query.last == 'undefined' || req.query.last == ''){
    return res.status(500).json({ err: 'last name required'});
  } else {
    Bluebird.promisify(dns.resolveMx)(req.query.domain).then(function (mxServers) {
      var sorted = _.sortBy(mxServers, 'priority');
      if(sorted.length > 0 && typeof sorted[0] == 'undefined'){
        return res.json({err: 'Could not find email'});
      }else{
        return Bluebird.promisify(dns.resolve4)(sorted[0].exchange);
      }
    }).then(function(data) {
      if(typeof data == 'undefined'){
        return res.json({err: 'Could not find email'});
      }else{

        var proxyArry = emailAccount.proxy.split(":");
        var ip = proxyArry[0];
        var port = proxyArry[1];
        var username = proxyArry[2];
        var password = proxyArry[3];
        console.log(ip, port, username, password);
        var to = "sean@sharkagent.com";
        var mxRecordIp = data[0];
        //console.log(mxRecordIp);
        //return res.json({mxRecordIp: mxRecordIp})
        var proxyPort = 8083;
        var smtpPort = 25;
        var TCP_BUFFER_SIZE = 1024;



        /*var proxy = net.createServer(function (socket) {
          var client;

          console.log('Client connected to proxy');

          // Create a new connection to the SMTP server
          client = net.connect(port, ip);

          // 2-way pipe between client and TCP server
          socket.pipe(client).pipe(socket);

          client.on('connect', function() {
            client.write('HELO www.' + randomStr(Math.floor((Math.random() * 10) + 4)) + '.com\r\n');
            client.write("MAIL FROM: <"+ from +">\r\n");
            client.write("rcpt to:<" + to + ">\r\n");
          });

          client.on('data', function(data) {
            console.log('Received: ' + data);
            if(data.toString().match(/250/i) != null){
              console.log('final check OK email valid.');
              client.destroy();
            } else if(data.toString().match(/220/i) != null || data.toString().match(/250/i) != null){
              console.log('email valid')
            }else{
              console.log('email not valid');
              client.destroy();
            }
            //client.destroy(); // kill client after server's response
          });

          socket.on('close', function () {
            console.log('Client disconnected from proxy');
          });

          socket.on('error', function (err) {
            console.log('Error: ' + err.soString());
          });
        });

        //connect to proxy
        var client = new net.Socket();
        client.connect(port, ip, function(socket) {
          //socket.pipe(socket)
          console.log('logged in')

        });

        client.on('connect', function(socket) {
          console.log('connected to proxy')
          client.write('helo');
        });

        client.on('data', function(data) {
          console.log(data)
        });*/

        /*var conn = net.createConnection(port,ip);
        conn.on("connection", function (socket) {
          console.log('found connection');
          socket.on("data", function (c) {
            console.log('opened connection');
            var data = c + ''; // make sure it's a string
            switch (data) {
              case 'login: ': // prompting you for a login
                socket.write(username);  // send username
                break;
              case 'password: ': // prompting you for password
                socket.write(password);  // send password
                break;
              case 'Invalid Username!':
                // handle this
                break;
              default:
                // do something else
                break;
            }
          })
          socket.on("end", function () {
            // ITS OVER!
          })
        })*/

        // Create a new connection to the TCP server
        //...some stuff to get my proxy config (credentials, host and port)
        /*var proxyUrl = "http://" + username + ":" + password + "@" + ip + ":" + port;
console.log(proxyUrl)
        var proxiedRequest = request.defaults({'proxy': proxyUrl});
        proxiedRequest.get('http://www.sharkagent.com')*/


        /*var client = new net.Socket();
        client.connect(smtpPort, mxRecordIp, function(socket) {
          //socket.pipe(socket)
        });

        client.on('connect', function() {
          client.write('HELO www.' + randomStr(Math.floor((Math.random() * 10) + 4)) + '.com\r\n');
          client.write("MAIL FROM: <"+ from +">\r\n");
          client.write("rcpt to:<" + to + ">\r\n");
        });

        client.on('data', function(data) {
          console.log('Received: ' + data);
          if(data.toString().match(/250/i) != null){
            console.log('final check OK email valid.');
            client.destroy();
          } else if(data.toString().match(/220/i) != null || data.toString().match(/250/i) != null){
            console.log('email valid')
          }else{
            console.log('email not valid');
            client.destroy();
          }
          //client.destroy(); // kill client after server's response
        });

        client.on('close', function() {
          console.log('Connection closed');
        });
        client.on('error', function(err) {
          console.log(err)
        })*/
      }


    }).catch(function (err) {
      console.log(err);
      return res.json({err: err});
    });
  }
};
