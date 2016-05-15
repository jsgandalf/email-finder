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
var PrivateProxy = require('../../models/privateProxies');
var Lead = require('../../models/lead.model');
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
  var match = str.match(/^\S+/g);
  if(match != null && match.length > 0 && match[0] != null){
    str = match[0];
  }
  return str.replace(/[^\w\s]/gi, '')
}

function purifyDomain(url) {
  var domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return purifyDomain2(domain);
}

function purifyDomain2(domain){
  var parts = domain.split('.');
  var subdomain = parts.shift();
  return parts.join('.');
  /*domain = domain.replace('https://', '');
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
  return domain;*/
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
        if (retry < 3) {
          console.log('retry: ',retry);
          reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: proxy });
        } else {
          resolve(false);
        }
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
          //If it is clogged you will get 450 4.2.1  https://support.google.com/mail/answer/6592 6si12648809pfe.172 - gsmtp
          if(responseData.match(/450 4.2.1/i) != null && responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null){
            resolve(emailToVerify);
          }
          //If proxy is blocked -- select another one.
          else if(responseData.match(/554(\s|\-)/i) != null){
            console.log('Spam IP trying to verify: ', emailToVerify)
            //reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: undefined });
            resolve(false);
            //console.log('destroy socket');
            socket.destroy();
          }else if (responseData.match(/5[0-9][0-9](\s|\-)/i) != null && responseData.match(/221/i) != null) {
            console.log("Not a valid email: ",emailToVerify)
            /*console.log(emailToVerify)
            console.log(responseData)*/
            socket.destroy();
            resolve(false);
          } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) {
            socket.destroy();
            console.log("Verified: " + emailToVerify);
            //console.log(responseData)
            resolve(emailToVerify);
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

function verifyEmail(domain, mxRecordIp, emailToVerify, retry, oldProxy){
  console.log("trying to verify: " + emailToVerify)
  var updatePromise = Q.when(false);
  if(typeof oldProxy != 'undefined' && oldProxy != null && oldProxy){
    updatePromise = Proxy.update({ _id: oldProxy._id}, { $set: { isDead: true}}).exec();
  }

  return updatePromise.then(function() {
    return PrivateProxy.find({ isDead: false, rnd: {$gte: Math.random()} }).sort({rnd:1}).limit(1).exec();
  }).then(function(proxy) {
    if (proxy.length == 0 || proxy == null || typeof proxy == 'undefined') {
      return emailController.sendMessage('Problem on Messagesumo Checker', 'You have run out of available proxies on email checker. Check your database or increase with your proxy provider plan!  This is very bad... This means you need to get a developer looking at the messagesumo-email checker app ASAP, no questions asked.');
    }
    proxy = proxy[0];
    return createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry)
      .catch(function(data){
        console.log(data);
        return verifyEmail(domain, data.mxRecordIp, data.emailToVerify, data.retry, data.proxy); //Retry up to 10 times with available proxies.
      });
  });
}


// Get list of accounts
exports.index = function(req, res) {
  var domain,
    firstName,
    lastName,
    patterns = [
    '{f}{last}',
    '{last}',
    '{first}',
    '{f}{f2}{last}',
    '{first}{l}',
    '{first}.{last}',
    '{first}{last}',
    '{f}{l}',
    '{first}_{last}',
    '{first}-{last}'
  ];

  firstName = purifyName(req.query.first);
  lastName = purifyName(req.query.last);
  domain = purifyDomain(req.query.domain);

  var promise = new Bluebird(function(resolve){ resolve(domain)});
  //invoke a company lookup if this is not a url.
  if (domain.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i) == null) {
    //The Zrnich Law Group, P.C.
    promise = GoogleCtrl.findCompanyWebsite(domain);
  }

  promise.then(function(data) {
    console.log(data);
    domain = purifyDomain(data.toLowerCase());
    console.log(domain);
    return Lead.findOne({firstName: firstName, lastName: lastName, domain: domain}).exec();
  }).then(function(lead) {
    if (typeof lead != 'undefined' && lead != null && moment(lead.created).isAfter(moment().subtract(3, 'months'))) {
      console.log("Loading from cache");
      return Q.when(lead);
    } else {
      var promise = Q.when(true);
      if (typeof lead != 'undefined' && lead != null && moment(lead.created).isBefore(moment().subtract(3, 'months'))) {
        //console.log('deleting cache and refreshing');
        promise = Lead.remove({ _id: lead._id }).exec();
      }
      return promise.then(function() {
        return Bluebird.promisify(dns.resolveMx)(domain);
      }).then(function (mxServers) {
        if (typeof mxServers == 'undefined' || mxServers.length < 1) {
          throw new Error('Could not find Domain location');
        }
        var sorted = _.sortBy(mxServers, 'priority');
        if (sorted.length > 0 && typeof sorted[0] == 'undefined') {
          throw new Error('Domain not found');
        } else {
          return Bluebird.promisify(dns.resolve4)(sorted[0].exchange);
        }
      }).then(function (data) {
        //console.log(data);
        if (typeof data == 'undefined') {
          throw new Error('Domain not found');
        } else {

          var mxRecordIp = data[0];

          /*return reflectMap(patterns, function (pattern) {
            var emailPattern = pattern
              .replace('{first}', firstName)
              .replace('{last}', lastName)
              .replace('{f}', firstName.charAt(0))
              .replace('{f2}', firstName.charAt(1))
              .replace('{l}', lastName.charAt(0));

            return verifyEmail(domain, mxRecordIp, emailPattern.toLowerCase() + '@' + domain, 0, false);
          });*/

          return Q.when(['sean@gmail.com']);
        }
      }).then(function (verifiedEmails) {
        console.log('-------- all settled ---------');
        console.log(verifiedEmails);
        var emails = _.filter(verifiedEmails, function (email) {
          return email;
        }).map(function (email) {
          return email.toLowerCase();
        });
        var guessEmail = '{f}{last}'
          .replace('{last}', lastName)
          .replace('{f}', firstName.charAt(0));
        var confidence = Math.floor(Math.random() * 7) + 1;
        var email = guessEmail.toLowerCase() + '@' + domain;

        if (emails.length > 0) {
          email = emails[0];
          confidence = 20/emails.length + 80;
        }
        if(emails.length < 1) {
          emails = [guessEmail.toLowerCase() + '@' + domain];
        }

        var result = {
          firstName: firstName,
          lastName: lastName,
          domain: domain,
          email: email,
          confidence: confidence,
          response: emails,
          created: new Date()
        };

        var catchAll = false;
        if(emails.length == patterns.length) {
          result.catchAll = true;
          catchAll = true;
        }

        return Lead.create(result).then(function(myResult) {
          myResult.catchAll = catchAll;
          return myResult;
        });
      })
    }
  }).then(function(lead) {
    return res.json(lead);
  }).catch(function (err) {
    console.log(err);
    return res.json({"error": "No email found"});
  });
};

//db.proxies.remove({ created: { $lte: ISODate("2016-04-19T15:34:02.242Z") }})
