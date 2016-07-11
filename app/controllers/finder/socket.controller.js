var Socks = require('socks');
var emailAccounts = require('../../../config/emailAccounts');
var Bluebird = require('bluebird');
var emailController = require('../email/email.controller');
exports.createSocketConnection = createSocketConnection;

function retryVerification(retry, params, cb){
  if(retry < 2) {
    cb(params);
  } else {
    cb(false);
  }
}

var numOpen = 0;
var ids = 10000;
var open = [];

function createSocketConnection(domain, proxy, mxRecordIp, emailToVerify, retry){
  numOpen += 1;
  var logId = ++ids;
  open.push(logId);
  console.log(logId + ' tagCreateSocket '+ numOpen);
  var smtpPort = 25;
  var emailAccount = emailAccounts[Math.floor((Math.random() * 49))];

  //console.log('Try: ' + proxy.ip);
  var options = {
    proxy: {
      ipaddress: proxy.ip, // Random public proxy
      port: proxy.port,
      type: proxy.type // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
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
  return Bluebird.using(createSocket(options), function(socket) {
    //console.log("mxRecord: " + mxRecordIp);
    console.log(logId + ' Verifying: ' + emailToVerify);
    console.log(logId + ' got a connection');
    var responseData = "";
    return new Bluebird(function(resolve, reject) {
      var commands = 0;
      socket.write('EHLO '+ domain + '\r\n');
      socket.on('data', function (data) {
        data = data.toString("utf-8");
        console.log(data.split("\n").map(function(str) { return logId + ' got data!! ' + str; }).join("\n"));
        responseData += data;
        //console.log(data);
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
        if((responseData.match(/452 4.1.1/i) != null ||responseData.match(/450 4.2.1/i) != null) && responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null){
          console.log(logId + ' Clogged, retry with 452');
          retryVerification(retry,{emailToVerify: emailToVerify, mxRecordIp: mxRecordIp, retry: retry + 1, provider: 'ovh'}, reject);
        }
        else if(responseData.match(/451 4.3.2/) != null) {
          console.log(logId + ' 451 server error');
          resolve(false);
        }
        //PROXY IS BLOCKED
        else if(responseData.match(/\n503(\s|\-)/i) != null || (responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)!= null)) {
          console.log(logId + ' 503 response or 554')
          emailController.errorMessage(err, data+ ' received a 503 message... Client host rejected: Improper use of SMTP command pipelining... beware and investigate, maybe its because you are using ELHO instead of HELO?: ' + emailToVerify + ' \n domain: '+domain+ ' \n proxy: '+JSON.stringify(proxy));
          resolve(false);
        }
        else if(responseData.match(/spamhaus/i) != null) {
          console.log(logId + ' Spamhaus')
          emailController.errorMessage(err, data+ ' Spamhaus violation! Watch out!: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
          reject(false);
        }else if(responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)== null) {
          emailController.errorMessage(err, data+ ' received a 554 message... either spam or sync error... beware and investigate: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
          console.log(logId + ' 554!')
          reject(false);
        }else if (responseData.match(/\n5[0-9][0-9](\s|\-)/i) != null && responseData.match(/221/i) != null) { //NOT A VALID EMAIL console.log("Not a valid email: ",emailToVerify)
          console.log(logId + ' Not a valid email!')
          resolve(false);
        } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) { //VERIFIED!!! :) console.log("Verified: " + emailToVerify);
          console.log(logId + ' verified!')
          console.log(logId + ' :: ' + emailToVerify)
          resolve(emailToVerify);
        }
      });
      socket.on('close', function () {
        console.log(logId + ' closed!!');
        resolve(false);
      });

      socket.on('error', function (err) {
        console.log(logId + ' errored!!');
        resolve(false);
      });

      // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
      socket.resume();
    }).timeout(15000, 'Timeout');
  }).catch(function(error) {
    console.log(logId + ' Error: ' + error);
    return false;
  }).finally(function(){
    numOpen -= 1;
    console.log(logId + ' tagCloseSocket '+ numOpen);
    open.splice(open.indexOf(logId), 1);
    writeFile(open);
  });
}

function createSocket(options) {
  return Bluebird.fromCallback(function(cb) {
    Socks.createConnection(options, cb);
  }).disposer(function(socket) {
    socket.destroy();
  });
}

function constructOneAtATime() {
  var running = false;
  var next = null;
  return function oneAtATime(fn) {
    if(!running) {
      running = true;
      fn(onFinish);
    } else {
      next = fn;
    }
  }
  function onFinish() {
    if(next) {
      next(onFinish);
      next = null;
    } else {
      running = false;
    }
  }
}

var oneAtATime = constructOneAtATime();

function writeFile(open) {
  var str = open.map(function(str) { return str + "\n"; }).join("");
  var fs = require('fs');
  oneAtATime(function(cb) {
    fs.writeFile(process.cwd() + '/open.txt', str, 'utf8', cb);
  });
}
