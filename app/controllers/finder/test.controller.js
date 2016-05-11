/*
var Bluebird = require('bluebird');
var Q = require('q');
var dns = require('dns');
var _ = require('lodash');
var net = require('net');
var emailAccounts = require('../../../config/emailAccounts');
var request = require('request');
var Socks = require('socks');
var GoogleCtrl = require('./google.controller');
var Proxy = require('../../models/proxy');
var emailController = require('../email/email.controller');
var config = require('../../../config/config');
var moment = require('moment');
var reflectMap = require('../../utils/reflect-map');

function randomStr(m) {
  var m = m || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (var i=0; i < m; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
  return s;
};

function purifyName(str){
  return str.replace(/[^\w\s]/gi, '')
}

function purifyDomain(domain){
  domain = domain.replace('https://', '');
  domain = domain.replace('http://', '').replace('www.', '');
  /!*if(domain == 'google.com'){
   domain = 'gmail.com';
   }*!/
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

function createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry){
  return new Bluebird(function (resolve, reject) {
    var smtpPort = 25;
    var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];

    //console.log('Try: ' + proxy.ip);

    var options = {
      proxy: {
        ipaddress: proxy.ip, // Random public proxy
        port: proxy.port,
        type: proxy.type, // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
        //userid: username + ":" + password
        /!*authentication: {
         username: username,
         password: password
         }*!/
      },
      target: {
        host: mxRecordIp, // can be an ip address or domain (4a and 5 only)
        port: smtpPort
      },
      command: 'connect'  // This defaults to connect, so it's optional if you're not using BIND or Associate.
    };

    if(typeof proxy.username != 'undefined' && proxy.username != null && typeof proxy.password != 'undefined' && proxy.password != null ) {
      options.proxy.authentication = {
        username: proxy.username,
        password: proxy.password
      }
    }

    //console.log("mxRecord: " + mxRecordIp);

    Socks.createConnection(options, function (err, socket, info) {
      var responseData = "";
      if (err) {
        //console.log('failed to connect');
        console.log(err);
        if (retry < 10) {
          console.log('retry: ',retry);
          resolve({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: proxy });
        } else {
          reject(false);
        }
        reject(false);
      } else {
        console.log('writing Helo');
        socket.write('HELO '+ domain + '\r\n');
        socket.write("MAIL FROM: <" + emailAccount.email + ">\r\n");
        //socket.write("MAIL FROM: <johnsmith@gmail.com>\r\n");
        socket.write("rcpt to:<" + emailToVerify + ">\r\n");
        socket.write("QUIT\r\n");
        socket.on('data', function (data) {
          data = data.toString("utf-8");
          responseData += data;
          console.log(data);
          //If proxy is blocked -- select another one.
          if(responseData.match(/554(\s|\-)/i) != null && responseData.match(/220/i) != null){
            console.log('Spam IP trying to verify: ', emailToVerify)
            resolve({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: undefined });
            //console.log('destroy socket');
            socket.destroy();
          }else if (responseData.match(/5[0-9][0-9](\s|\-)/i) != null && responseData.match(/221/i) != null) {
            console.log("Not a valid email: ",emailToVerify)
            /!*console.log(emailToVerify)
             console.log(responseData)*!/
            socket.destroy();
            reject(false);
          } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) {
            socket.destroy();
            console.log("Verified: " + emailToVerify);
            //console.log(responseData)
            resolve({emailToVerify: emailToVerify, retry: 0});
          }
        });
        socket.on('close', function () {
          //console.log('Client disconnected from proxy');
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

function verifyEmail(domain, emailToVerify, retry){
  console.log("trying to verify: " + emailToVerify)
  return createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry)
    .then(function(data){
      if(!data) {
        return false; //a verified 5** response from the SMTP server
      } else if(data.retry != 0) {
        return verifyEmail(domain, data.mxRecordIp, data.emailToVerify, data.retry, data.proxy); //Retry up to 10 times with available proxies.
      } else {
        return data.emailToVerify;
      }
    }).catch(function(err){
      console.log(err);
      return false;
    });
}


// Get list of accounts
exports.index = function(req, res) {
      var firstName = "sean",
        lastName = "thomas",
        domain = "solarninja.com";
      var patterns = [
        '{f}{last}',
        '{last}'
        /!*'{f}{f2}{last}',
         '{first}',
         '{first}{l}',
         '{first}.{last}',
         '{first}{last}',
         '{f}{l}',
         '{first}_{last}',
         '{first}-{last}'*!/
      ];

      return reflectMap(patterns, function(pattern) {
        var emailPattern = pattern
          .replace('{first}', firstName)
          .replace('{last}', lastName)
          .replace('{f}', firstName.charAt(0))
          .replace('{f2}', firstName.charAt(1))
          .replace('{l}', lastName.charAt(0));

        return verifyEmail(domain, emailPattern.toLowerCase() + '@' + domain, 0);
      });
    }
  }).then(function(results) {
    var verifiedEmails = [];
    /!*if (results.length > 0) {
     results.forEach(function (result) {
     if (result.state == "fulfilled") {
     verifiedEmails.push(result.value);
     }
     });
     }*!/
    console.log('-------- all settled ---------');
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
          "last": lastName,
          "email": emails[0],
          "first": firstName,
          "confidence": 100,
          "response": emails
        }
      });
    }else{
      //Could not find email at all: going to guess blind guess:
      var guessEmail = '{f}{last}'
        .replace('{last}', lastName)
        .replace('{f}', firstName.charAt(0));
      return res.json({
        "response": {
          "profile": {},
          "domain": domain,
          "last": lastName,
          "email": guessEmail.toLowerCase() + '@' + domain,
          "first": firstName,
          "confidence": (Math.floor(Math.random() * 9) + 1),
          "response": [guessEmail.toLowerCase() + '@' + domain]
        }
      });
    }
  }).catch(function (err) {
    console.log(err);
    return res.json({"response":{"error":"No email found"}});
  });
};
*/
