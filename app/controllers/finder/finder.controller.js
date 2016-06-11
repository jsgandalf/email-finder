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
var reflectMapWait = require('../../utils/reflect-map-wait');
var uuid = require('node-uuid');

function randomStr(m) {
  var m = m || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (var i=0; i < m; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
  return s;
};

function cleanFirst(str){
  var match = str.split(' ');
  if(match != null && match.length > 0 && match[0] != null && match[1] != null) {
    str = match[0];
  }
  return str;
}

function cleanLast(str){
  var match = str.split(' ');
  if(match != null && match.length > 0 && match[0] != null && match[1] != null) {
    str = match[1];
  }
  return str;
}

function purifyName(str){
  return (str.replace(/[^\w\s]/gi, '')).trim();
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
  domain = domain.replace('https://', '');
  domain = domain.replace('http://', '')
  if(domain.match('www') != null) {
    domain = domain.replace('www.', '');
  }else if(domain.split('.').length > 2){
    domain = domain.replace(/^[^.]+\./g, "");
  }

  /*if(domain.indexOf('.com') != -1){
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
  }*/
  return domain.trim();
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
      setTimeout(function(){
        socket.destroy();
        resolve(false);
      }, 15000);
      var responseData = "";
      if (err) {
         //Retry once
         console.log(err);
        if (retry < 1) {
          console.log('retry: ',retry);
          reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: proxy });
        } else {
          resolve(false);
        }
      } else {
        var commands = 0;
        //console.log('writing Helo');
        socket.write('EHLO '+ domain + '\r\n');

        //socket.write("MAIL FROM: <johnsmith@gmail.com>\r\n");

        socket.on('data', function (data) {
          data = data.toString("utf-8");
          responseData += data;
          console.log(data);

          if(responseData.match(/220/i) != null && commands === 0){
            commands += 1;
            socket.write("MAIL FROM: <" + emailAccount.email + ">\r\n");
          }else if(responseData.match(/250/i) != null && commands > 0){
            socket.write("rcpt to:<" + emailToVerify + ">\r\n");
            socket.write("QUIT\r\n");
          }
          if(responseData.match(/450 4.2.1/i) != null || responseData.match(/\n5[0-9][0-9](\s|\-)/i) != null){
            socket.write("QUIT\r\n");
          }


          //If it is clogged you will get 450 4.2.1  https://support.google.com/mail/answer/6592 6si12648809pfe.172 - gsmtp
          if(responseData.match(/450 4.2.1/i) != null && responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null){
            resolve(emailToVerify);
          }
          //If proxy is blocked -- select another one.
          else if(responseData.match(/\n503(\s|\-)/i) != null){
            emailController.errorMessage(err, data+ ' received a 503 message... Client host rejected: Improper use of SMTP command pipelining... beware and investigate, maybe its because you are using ELHO instead of HELO?: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
            //reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: undefined });
            resolve(false);
            //console.log('destroy socket');
            socket.destroy();
          }
          else if(responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)!= null){
            resolve(false);
            //console.log('destroy socket');
            socket.destroy();
          }
          else if(responseData.match(/spamhaus/i) != null) {
            emailController.errorMessage(err, data+ ' Spmahaus violation!!! Watch out!!!: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
            reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: undefined });
          }else if(responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)== null){
            console.log('Spam IP trying to verify: ', emailToVerify)
            emailController.errorMessage(err, data+ ' received a 554 message... either spam or sync error... beware and investiage: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
            reject({emailToVerify: emailToVerify, mxRecordIp:mxRecordIp, retry: retry + 1, proxy: undefined });
            socket.destroy();
          }else if (responseData.match(/\n5[0-9][0-9](\s|\-)/i) != null && responseData.match(/221/i) != null) {
            console.log("Not a valid email: ",emailToVerify)
            socket.destroy();
            resolve(false);
          } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) {
            socket.destroy();
            console.log("Verified: " + emailToVerify);
            resolve(emailToVerify);
          }
        });
        socket.on('close', function () {
          socket.destroy();
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

function unsetProxy(proxyId){
  var deferred = Q.defer();
  PrivateProxy.update({
    _id: proxyId
  }, {
    $unset: {
      scriptId: "",
      scriptDate: ""
    }
  }, {multi: false}, function(err, data) {
    if(err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }
  });
  return deferred.promise;
}

function updateRandomProxy(myId, provider){
  var date = new Date(); //Lock Error
  //date.setMinutes(date.getHours() - 48);
  date.setMinutes(date.getMinutes() - 1);
  return PrivateProxy.update({
    isDead: false,
    provider: provider,
    rnd: {$gte: Math.random()},
    $or: [
      {scriptId: {$exists: false}},
      {scriptDate: {$lt: date }}
    ] }, {
    $set: {
      scriptId: myId,
      scriptDate: new Date()
    }
  }, {multi: false}).then(function(data){
    if(data.nModified != 1){
      return Bluebird.delay(500).then(function(){ return updateRandomProxy(myId)});
    }else {
      return data;
    }
  });
}

function verifyEmail(domain, mxRecordIp, emailToVerify, retry, oldProxy){
  console.log("trying to verify: " + emailToVerify)
  if(typeof oldProxy != 'undefined' && oldProxy != null && oldProxy){
    updatePromise = Proxy.update({ _id: oldProxy._id}, { $set: { isDead: true}}).exec();
  }
  var myId = uuid.v4();
  return updateRandomProxy(myId, 'ovh').then(function(){
    return PrivateProxy.find({scriptId: myId}).exec();
  }).then(function(proxy) {
    if (proxy.length == 0 || proxy == null || typeof proxy == 'undefined') {
      return emailController.sendMessage('Problem on Messagesumo Checker', JSON.stringify(proxy)+ ' ---- '+  +'You have run out of available proxies on email checker. Check your database or increase with your proxy provider plan!  This is very bad... This means you need to get a developer looking at the messagesumo-email checker app ASAP, no questions asked.');
    }
    proxy = proxy[0];
    return createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry)
      .then(function(data) {
        return unsetProxy(proxy._id).then(function() {
          return data;
        });
      }).catch(function(data){
        return verifyEmail(domain, data.mxRecordIp, data.emailToVerify, data.retry, data.proxy); //Retry up to 3 times with available proxies.
      });
  });
}

function verifyEmailProxyService(domain, mxRecordIp, emailToVerify, retry, provider){
  console.log("trying to verify: " + emailToVerify)
  if(typeof provider == 'undefined' || provider == null){
    provider = 'ovh';
  }
  var myId = uuid.v4();
  return updateRandomProxy(myId, provider).then(function(){
    return PrivateProxy.find({scriptId: myId}).exec();
  }).then(function(proxy) {
    if (proxy.length == 0 || proxy == null || typeof proxy == 'undefined') {
      return emailController.sendMessage('Problem on Messagesumo Checker', JSON.stringify(proxy)+ ' ---- '+  +'You have run out of available proxies on email checker. Check your database or increase with your proxy provider plan!  This is very bad... This means you need to get a developer looking at the messagesumo-email checker app ASAP, no questions asked.');
    }
    proxy = proxy[0];
    return createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry)
      .then(function(data) {
        return unsetProxy(proxy._id).then(function() {
          return data;
        });
      }).catch(function(data){
        return verifyEmailProxyService(domain, data.mxRecordIp, data.emailToVerify, data.retry,'ovh'); //Retry up to 1 times with available proxies.
      });
  });
}

function getDns(sorted, retry){
  return Bluebird.promisify(dns.resolve4)(sorted[retry].exchange).catch(function(){
    retry += 1;
    if(retry < sorted.length) {
      return getDns(sorted, retry);
    }else{
      throw new Error('Could not find exchange servers');
    }
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

  firstName = cleanFirst(purifyName(req.query.first)).toLowerCase();
  lastName = cleanLast(purifyName(req.query.last)).toLowerCase();
  domain = purifyDomain(req.query.domain);

  var promise = new Bluebird(function(resolve){ resolve(domain)});
  //invoke a company lookup if this is not a url.
  if (domain.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/i) == null) {
    //The Zrnich Law Group, P.C.
    promise = GoogleCtrl.findCompanyWebsite(domain);
  }

  promise.then(function(data) {
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
          return getDns(sorted, 0);
        }
      }).then(function (data) {
        if (typeof data == 'undefined') {
          throw new Error('Domain not found');
        } else {
          return data
        }
      }).then(function(data){
        var mxRecordIp = data[0];
        //console.log(mxRecordIp);
        return reflectMapWait(patterns, function (pattern) {
          var emailPattern = pattern
            .replace('{first}', firstName)
            .replace('{last}', lastName)
            .replace('{f}', firstName.charAt(0))
            .replace('{f2}', firstName.charAt(1))
            .replace('{l}', lastName.charAt(0));
          console.log(emailPattern)
          return verifyEmailProxyService(domain, mxRecordIp, emailPattern.toLowerCase() + '@' + domain, 0, 'proxyRack');
        });
      }).then(function (verifiedEmails) {
        console.log('-------- all settled ---------');
        console.log(verifiedEmails);
        var saveLead = false;
        var emails = _.filter(verifiedEmails, function (email) {
          return typeof email == 'string';
        });
        emails = _.map(emails, function (email) {
          return email.toLowerCase();
        });
        var guessEmail = '{f}{last}'
          .replace('{last}', lastName)
          .replace('{f}', firstName.charAt(0));
        var confidence = (Math.floor(Math.random() * 7) + 1, 10);
        var email = guessEmail.toLowerCase() + '@' + domain;

        if (emails.length > 0) {
          saveLead = true;
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
          confidence: parseInt(confidence,10),
          response: emails,
          created: new Date()
        };

        var catchAll = false;
        if(emails.length == patterns.length) {
          result.catchAll = true;
          catchAll = true;
        }

        if (saveLead) {
          return Lead.create(result).then(function (myResult) {
            myResult.catchAll = catchAll;
            return myResult;
          });
        } else {
          return result;
        }
      })
    }
  }).then(function(lead) {
    return res.json(lead);
  }).catch(function (err) {
    console.log(err);
    var guessEmail = '{f}{last}'
      .replace('{last}', lastName)
      .replace('{f}', firstName.charAt(0));

    var result = {
      firstName: firstName,
      lastName: lastName,
      domain: domain,
      email: guessEmail.toLowerCase() + '@' + domain,
      confidence: parseInt((Math.floor(Math.random() * 7)) + 1, 10),
      response: [guessEmail.toLowerCase() + '@' + domain],
      created: new Date(),
      catchAll: false
    };

    if(err == 'Could not find domain name for this company in google'){
      res.status(500).json({ error: 'Could not find email'})
    }else{
      res.status(200).json(result);
    }
    if(typeof err != 'undefined' && err != null && err.code == 'ENODATA'){
      console.log('got here!!')
    }
    emailController.errorMessage(err, JSON.stringify(result));
    //not good input... this means we couldn't verify the exchange records or mail records...
  });
};

//db.proxies.remove({ created: { $lte: ISODate("2016-04-19T15:34:02.242Z") }})
