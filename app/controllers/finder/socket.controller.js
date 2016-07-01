var Socks = require('socks');
var emailAccounts = require('../../../config/emailAccounts');
var Bluebird = require('bluebird');

exports.createSocketConnection = createSocketConnection;

function retryVerification(retry, params, cb){
  if(retry < 2) {
    cb(params);
  } else {
    cb(false);
  }
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

    //console.log("mxRecord: " + mxRecordIp);

    Socks.createConnection(options, function (err, socket, info) {
      var responseData = "";
      if (err) {
        console.log(err);
        resolve(false);
      } else {
        var commands = 0;
        socket.write('EHLO '+ domain + '\r\n');
        console.log('hello');
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
          if((responseData.match(/452 4.1.1/i) != null ||responseData.match(/450 4.2.1/i) != null) && responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null){
            retryVerification(retry,{emailToVerify: emailToVerify, mxRecordIp: mxRecordIp, retry: retry + 1, provider: 'ovh'}, reject);
          }
          //PROXY IS BLOCKED
          else if(responseData.match(/\n503(\s|\-)/i) != null || (responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)!= null)) {
            //emailController.errorMessage(err, data+ ' received a 503 message... Client host rejected: Improper use of SMTP command pipelining... beware and investigate, maybe its because you are using ELHO instead of HELO?: ' + emailToVerify + ' \n domain: '+domain+ ' \n proxy: '+JSON.stringify(proxy));
            resolve(false);
            socket.destroy();
          }
          else if(responseData.match(/spamhaus/i) != null) {
            //emailController.errorMessage(err, data+ ' Spamhaus violation! Watch out!: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
            reject(false);
          }else if(responseData.match(/\n554(\s|\-)/i) != null && responseData.match(/554 5.7.1/)== null) {
            //emailController.errorMessage(err, data+ ' received a 554 message... either spam or sync error... beware and investigate: ' + emailToVerify + 'domain: '+domain+ 'proxy: '+JSON.stringify(proxy));
            reject(false);
            socket.destroy();
          }else if (responseData.match(/\n5[0-9][0-9](\s|\-)/i) != null && responseData.match(/221/i) != null) { //NOT A VALID EMAIL console.log("Not a valid email: ",emailToVerify)
            socket.destroy();
            resolve(false);
          } else if (responseData.match(/221/i) != null && responseData.match(/250/i) != null && responseData.match(/220/i) != null) { //VERIFIED!!! :) console.log("Verified: " + emailToVerify);
            socket.destroy();
            resolve(emailToVerify);
          }
        });
        socket.on('close', function () {
          socket.destroy();
        });

        socket.on('error', function (err) {
          socket.destroy();
        });

        // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
        socket.resume();
      }
    });
  });
}
