var mandrill = require('mandrill-api/mandrill'),
  config = require('../../../config/config'),
  Q = require('q'),
  nodemailer = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport');


exports.send = function(fromName, fromEmail, list, subject, body, subaccount, listId, fileName, fileType, buffer) {
  var deferred = Q.defer();
  var mandrill_client = new mandrill.Mandrill(config.mandrill);
  var html = body;

  var message = {
    "subaccount": subaccount,
    "html": html,
    "text": body,
    "subject": subject,
    "from_email": fromEmail,
    "from_name": fromName,
    "to": list,
    "headers": {
      "Reply-To": fromEmail
    },
    "metadata": {
      "list": listId
    }
  };
  if( typeof buffer != 'undefined'){
    message.attachments = [
      {
        "type": fileType,
        "name": fileName,
        "content": buffer
      }
    ];
  }
  mandrill_client.messages.send({"message": message}, function(result) {
//    console.log(result);
    deferred.resolve(result);
  }, function(e) {
    deferred.reject(e.name + ' - ' + e.message);
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
  return deferred.promise;
};

//Just for sending to ourselves
exports.sendMessage = function(subject, body) {
  var deferred = Q.defer();
  var mandrill_client = new mandrill.Mandrill(config.mandrill);
  var html = body;

  var message = {
    "html": html,
    "text": body,
    "subject": subject,
    "from_email": config.systemEmail,
    "from_name": config.companyName,
    "to": [{
      "email": config.systemEmail,
      "name": config.companyName,
      "type": "to"
    },{
      "email": config.developerEmail,
      "name": config.companyName,
      "type": "to"
    }],
    "headers": {
      "Reply-To": config.systemEmail
    }
  };
  mandrill_client.messages.send({"message": message}, function(result) {
//    console.log(result);
    deferred.resolve(false);
  }, function(e) {
    deferred.reject(e.name + ' - ' + e.message);
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
  return deferred.promise;
};

exports.sendMessageDevelopment = function(subject, body) {
  var deferred = Q.defer();
  var mandrill_client = new mandrill.Mandrill(config.mandrill);
  var html = body;

  var message = {
    "html": html,
    "text": body,
    "subject": subject,
    "from_email": config.systemEmail,
    "from_name": config.companyName,
    "to": [{
      "email": config.developerEmail,
      "name": config.companyName,
      "type": "to"
    }],
    "headers": {
      "Reply-To": config.systemEmail
    },
  };
  mandrill_client.messages.send({"message": message}, function(result) {
//    console.log(result);
    deferred.resolve(result);
  }, function(e) {
    deferred.reject(e.name + ' - ' + e.message);
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
  return deferred.promise;
};

exports.errorMessage = function(err) {
  var mandrill_client = new mandrill.Mandrill(config.mandrill);
  var html = "<p>Error on Message Sumo Checker app,</p><p>" + err +'<p>' + err.stack + '</p>';
  var message = {
    "html": html,
    "text": config.companyName + " crash: " + err + ' '+ err.stack,
    "subject": config.companyName + " crash",
    "from_email": config.systemEmail,
    "from_name": config.companyName,
    "to": [{
      "email": config.developerEmail,
      "name": config.companyName + ' Info',
      "type": "to"
    }],
    "headers": {
      "Reply-To": config.systemEmail
    }
  };
  mandrill_client.messages.send({"message": message}, function(result) {
    return result;
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    return 'error';
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
};

exports.contactSupport = function(user, contactLog) {
  var mandrill_client = new mandrill.Mandrill(config.mandrill);
  var html = "<p>Question by: " + user.firstName + " " + user.lastName + ",</p>" +
    "<p>Problem: " + contactLog.problem +"</p>" +
    "<p>Priority: " + contactLog.priority + "</p>" +
    "<p>Message: " + contactLog.message + "</p>";
  var message = {
    "html": html,
    "text": html,
    "subject": config.companyName + " Contact Form by " + user.firstName,
    "from_email": config.systemEmail,
    "from_name": config.companyName,
    "to": [{
      "email": config.systemEmail,
      "name": config.companyName,
      "type": "to"
    }],
    "headers": {
      "Reply-To": config.systemEmail
    }
  };
  mandrill_client.messages.send({"message": message}, function(result) {
    return result;
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    return 'error';
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
};

exports.sendSmtpMessage = function(subject, body, emailAccount) {
  var deferred = Q.defer();
  var smtp;
  if(typeof emailAccount.service != 'undefined' && emailAccount.service != 'Smtp'){
    smtp = {
      /*host: email.smtpServer,
       port: email.smtpPort,*/
      service: 'gmail',
      auth: {
        user: emailAccount.username,
        pass: decrypt(emailAccount.hashedPassword)
      }
    }
  }else{
    smtp = {
      host: emailAccount.smtpServer,
      port: emailAccount.smtpPort,
      auth: {
        user: emailAccount.username,
        pass: decrypt(emailAccount.hashedPassword)
      }
    }
  }
  var transporter = nodemailer.createTransport(smtpTransport(smtp));
  var emailTo = req.user.email;
  if(process.env.NODE_ENV == 'development') {
    emailTo = "sean.alan.thomas@gmail.com";
  }
  transporter.sendMail({
    to: emailTo,
    from: emailAccount.from,
    subject: subject,
    text: message
  }, function(error){
    if(error){
      console.log(error);
      deferred.reject(error);
    } else {
      deferred.resolve('success');
      //console.log('Message sent: ' + info.response);
    }
  });

  return deferred.promise;
};
