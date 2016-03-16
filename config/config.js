var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development',
    _ = require('lodash');

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://adbrocks99:a14AbbJJ9dlkUi023jlsdf@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  },

  test: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://adbrocks99:a14AbbJJ9dlkUi023jlsdf@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  },

  production: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://adbrocks99:a14AbbJJ9dlkUi023jlsdf@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  }
};

var all = {
  googleApi: 'AIzaSyB6bcXvtyjWPSAT-aXZWNTTiwl_MfDNQiM', //messagesumo-email-checker
  googleCx: '006553027622961256205:kskdydpj1o0',
  mandrill: "3lLRQYVspHTIUmce9sIbZg",
  companyName: 'Message Sumo',
  companyPhone: '(425) 633-6351', //Current phone number in emails and other places.
  systemEmail: 'messagesumo@gmail.com',
  developerEmail: 'sean@messagesumo.com',
  apiKey: 'UZE6pY5Yz6z3ektV:NEgYhceNtJaee3ga:H5TYvG57F2dzJF7G'
};

module.exports = _.assign(config[env], all);
