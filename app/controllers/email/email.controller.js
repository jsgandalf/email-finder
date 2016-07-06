var mandrill = require('mandrill-api/mandrill'),
  config = require('../../../config/config'),
  Q = require('q'),
  Bluebird = require('bluebird'),
  nodemailer = require('nodemailer'),
  sendgrid = require('sendgrid');


exports.sendMessage = sendMessage;
exports.errorMessage = errorMessage;

//Just for sending to ourselves
function sendMessage(subject, text) {
  return (new Bluebird(function(resolve, reject) {
    var helper = require('sendgrid').mail;
    var from_email = new helper.Email(config.systemEmail, config.systemName);
    var to_email = new helper.Email(config.systemEmail);
    var content = new helper.Content("text/plain", text);
    var mail = new helper.Mail(from_email, subject, to_email, content);

    var sg = require('sendgrid').SendGrid(config.sendgridApi)
    var requestBody = mail.toJSON()
    var request = sg.emptyRequest()
    request.method = 'POST'
    request.path = '/v3/mail/send'
    request.body = requestBody
    sg.API(request, function (response) {
      resolve(response.body)
    })
  }));
};

function errorMessage(err, info) {
  return (new Bluebird(function(resolve, reject) {
    var text = config.companyName + " failure: " + err + ' '+ err.stack;
    var subject = config.companyName + " email checker failure";
    var helper = require('sendgrid').mail;
    var from_email = new helper.Email(config.systemEmail, config.systemName);
    var to_email = new helper.Email(config.systemEmail);
    var content = new helper.Content("text/plain", text);
    var mail = new helper.Mail(from_email, subject, to_email, content);

    var sg = require('sendgrid').SendGrid(config.sendgridApi)
    var requestBody = mail.toJSON()
    var request = sg.emptyRequest()
    request.method = 'POST'
    request.path = '/v3/mail/send'
    request.body = requestBody
    sg.API(request, function (response) {
      resolve(response.body)
    })
  }));
};
