var PrivateProxy = require('../../models/privateProxies');
var Bluebird = require('bluebird');
var dns = require('dns');
var _ = require('lodash');
var Lead = require('../../models/lead.model.js');



exports.randomStr = randomStr;
exports.cleanFirst = cleanFirst;
exports.cleanLast = cleanLast;
exports.purifyName = purifyName;
exports.purifyDomain = purifyDomain;
exports.randomStr = randomStr;
exports.getRandomProxy = getRandomProxy;
exports.formatResponse = formatResponse;
exports.getIp = getIp;
exports.handleError = handleError;

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

function getIp(domain){

  return Bluebird.promisify(dns.resolveMx)(domain).then(function (mxServers) {
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
      return data[0]
    }
  });

}


function unsetProxy(proxyId){
  return new Bluebird(function(resolve, reject) {
    PrivateProxy.update({
      _id: proxyId
    }, {
      $unset: {
        scriptId: true,
        scriptDate: true,
      }
    }, {multi: false}, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getRandomProxy(myId, provider) {
  return Bluebird.resolve(updateRandomProxy(myId, provider))
  .disposer(function(proxy) {
    if(proxy && proxy._id) {
      return unsetProxy(proxy._id);
    }
  });
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
      return Bluebird.delay(500).then(function(){ return updateRandomProxy(myId, provider)});
    } else {
      return PrivateProxy.findOne({scriptId: myId}).exec();
    }
  });
}

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
  return domain.trim();
}

/* anything above 79 is a pass */
function formatResponse(verifiedEmails, firstName, lastName, domain, patterns){
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

  //***TESTING
  //saveLead = false; //Comment this code out when in production **TEST
  //***TESTING

  if (saveLead) {
    return Lead.create(result).then(function (myResult) {
      myResult.catchAll = catchAll;
      return myResult;
    });
  } else {
    return Bluebird.resolve(result);
  }
}

function handleError(err, res, firstName, lastName, domain){
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

  if(err == 'Could not find domain name for this company in google') {
    return res.status(500).json({ error: 'Could not find email'})
  } else {
    return res.status(200).json(result);
  }
  //emailController.errorMessage(err, JSON.stringify(result)); //not good input... this means we couldn't verify the exchange records or mail records...
}

