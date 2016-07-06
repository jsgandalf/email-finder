var controller = require('./google.controller');

var proxy = {
  ip: "108.59.14.208",
  port: 13010,
  username: null,
  password: null
}

controller.tryGoogle("premera blue cross", proxy).done();

