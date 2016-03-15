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

function randomStr(m) {
  var m = m || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (var i=0; i < m; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
  return s;
};

function purifyDomain(domain){
  domain = domain.replace('http://', '').replace('www.', '');
  if(domain == 'google.com'){
    domain = 'gmail.com';
  }
  if(domain.indexOf('.com') != -1){
    domain = domain.substring(0, domain.indexOf('.com') + 4);
  }else if(domain.indexOf('.net') != -1){
    domain = domain.substring(0, domain.indexOf('.net') + 4);
  }else if(domain.indexOf('.org') != -1){
    domain = domain.substring(0, domain.indexOf('.org') + 4);
  }else if(domain.indexOf('.io') != -1){
    domain = domain.substring(0, domain.indexOf('.io') + 3);
  }else if(domain.indexOf('.us') != -1){
    domain = domain.substring(0, domain.indexOf('.us') + 3);
  }else if(domain.indexOf('.info') != -1){
    domain = domain.substring(0, domain.indexOf('.info') + 5);
  }
  return domain;
}

function createSocketConnection(proxy, mxRecordIp, emailToVerify, retry){
  return new Bluebird(function (resolve, reject) {
    var smtpPort = 25;
    var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];

    var options = {
      proxy: {
        ipaddress: proxy.ip, // Random public proxy
        port: proxy.port,
        type: proxy.type // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
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
    console.log(options)
    console.log(emailToVerify);

    Socks.createConnection(options, function (err, socket, info) {
      var emailVerified = false;
      var responseData = "";
      if (err) {
          //console.log('custom error');
         console.log(err);
        if (retry < 10) {
          resolve({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: proxy });
        } else {
          reject(false);
        }
      } else {
        socket.write('HELO www.' + randomStr(Math.floor((Math.random() * 10) + 4)) + '.com\r\n');
        socket.write("MAIL FROM: <" + emailAccount.email + ">\r\n");
        socket.write("rcpt to:<" + emailToVerify + ">\r\n");
        socket.write("QUIT\r\n");
        socket.on('data', function (data) {
          data = data.toString("utf-8");
          responseData += data;
          console.log(data);
          if (responseData.match(/5[0-9][0-9]/i) != null) {
            reject(false);
          } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) {
            resolve({emailToVerify: emailToVerify, retry: 0});
          }
        });
        socket.on('close', function () {
          //console.log('Client disconnected from proxy');
          //resolve(false);
        });

        socket.on('error', function (err) {
          //console.log('My Error: ' + err.toString());
          socket.destroy();
        });

        // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
        socket.resume();

        // 569
        // <Buffer 48 54 54 50 2f 31 2e 31 20 33 30 31 20 4d 6f 76 65 64 20 50 65...
      }
    });
  });
}

function verifyEmail(mxRecordIp, emailToVerify, retry, oldProxy){
  //console.log(emailToVerify);
  var updatePromise = Q.when(false);
  if(typeof oldProxy != 'undefined' && oldProxy != null && oldProxy){
    updatePromise = Proxy.update({ _id: oldProxy._id}, { $set: { isDead: true}}).exec();
  }
  return updatePromise.then(function() {
    return Proxy.find({rnd: {$gte: Math.random()}}).sort({rnd:1}).limit(1).exec();
  }).then(function(proxy) {
    if (proxy.length == 0 || proxy == null || typeof proxy == 'undefined') {
      return emailController.sendMessage('Problem on Messagesumo Checker', 'You have run out of available proxies on email checker. Check your database or increase with your proxy provider plan!  This is very bad... This means you need to get a developer looking at the messagesumo-email checker app ASAP, no questions asked.');
    }
    proxy = proxy[0];
    return createSocketConnection(proxy, mxRecordIp, emailToVerify, 0)
      .then(function(data){
        if(!data){
          return false; //a verified 5** response from the SMTP server
        }else if(data.retry != 0){
          return verifyEmail(data.mxRecordIp, data.emailToVerify, retry, data.proxy); //Retry up to 10 times with available proxies.
        }else{
          return data.emailToVerify;
        }
      }).catch(function(err){
        console.log(err);
        return false;
      })
  });
}


// Get list of accounts
exports.index = function(req, res) {
  var domain;
  if(req.query.key != config.apiKey) {
    return res.status(500).json({ err: 'api key required'});
  } else if(typeof req.query.domain == 'undefined' || req.query.domain == '') {
    return res.status(500).json({ err: 'domain required'});
  } else if(typeof req.query.first == 'undefined' || req.query.first == '') {
    return res.status(500).json({ err: 'first name required'});
  } else if(typeof req.query.last == 'undefined' || req.query.last == '') {
    return res.status(500).json({ err: 'last name required'});
  } else {
    domain = req.query.domain;

    domain = purifyDomain(domain);

    var promise = new Bluebird(function(resolve){ resolve(domain)});
    //invoke a company lookup if this is not a url.
    if (domain.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i) == null) {
      //The Zrnich Law Group, P.C.
      promise = GoogleCtrl.findCompanyWebsite(domain);
    }

    promise.then(function(data) {
      domain = purifyDomain(data.toLowerCase());
      return Bluebird.promisify(dns.resolveMx)(domain);
    }).then(function (mxServers) {
      if(typeof mxServers == 'undefined' || mxServers.length < 1){
        return res.json({"response":{"error":"No email found"}});
      }
      var sorted = _.sortBy(mxServers, 'priority');
      if(sorted.length > 0 && typeof sorted[0] == 'undefined'){
        return res.json({err: 'Could not find email'});
      }else{
        return Bluebird.promisify(dns.resolve4)(sorted[0].exchange);
      }
    }).then(function(data) {
      if(typeof data == 'undefined'){
        return res.json({"response":{"error":"No email found"}});
      }else{

        var mxRecordIp = data[0];

        var patterns = [
          '{f}{last}',
          '{first}',
          '{first}{l}',
          '{first}.{last}',
          '{first}{last}',
          '{f}{l}',
          '{first}_{last}',
          '{first}-{last}'
        ];

        return Q.allSettled(_.map(patterns, function(pattern) {
          var emailPattern = pattern
            .replace('{first}', req.query.first)
            .replace('{last}', req.query.last)
            .replace('{f}', req.query.first.charAt(0))
            .replace('{l}', req.query.last.charAt(0));

          return verifyEmail(mxRecordIp, emailPattern.toLowerCase() + '@' + domain, 0, false);
        }));
      }
    }).then(function(results) {
      var verifiedEmails = [];
      if (results.length > 0) {
        results.forEach(function (result) {
          if (result.state == "fulfilled") {
            verifiedEmails.push(result.value);
          }
        });
      }
      console.log(verifiedEmails);
      var emails = _.filter(verifiedEmails, function(email){
        return email;
      }).map(function(email){
        return email.toLowerCase();
      });
      if(emails.length > 0) {
        return res.json({
          "response": {
            "profile": {},
            "domain": domain,
            "last": req.query.last,
            "email": emails[0],
            "first": req.query.first,
            "confidence": parseInt(100/emails.length),
            "response": emails
          }
        });
      }else{
        //Could not find email at all: going to guess blind guess:
       var guessEmail = '{f}{last}'
          .replace('{last}', req.query.last)
          .replace('{f}', req.query.first.charAt(0));
        return res.json({
          "response": {
            "profile": {},
            "domain": domain,
            "last": req.query.last,
            "email": guessEmail.toLowerCase() + '@' + domain,
            "first": req.query.first,
            "confidence": (Math.floor(Math.random() * 9) + 1),
            "response": [guessEmail.toLowerCase() + '@' + domain]
          }
        });
      }
    }).catch(function (err) {
      console.log(err);
      return res.json({"response":{"error":"No email found"}});
    });
  }
};

function reflectMap(collection, fn) {
  var concurrency = 1;
  return Bluebird.map(collection, function(val) {
    return Bluebird.try(function() {
      return fn(val);
    }).then(null, function(error) {
      console.log('error in reflect map', error, error.stack);
    });
  }, {concurrency: concurrency});
}
