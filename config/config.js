var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://admindb1484988:z927fjD984KIc0Kdj1!390BBa@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  },

  test: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://admindb1484988:z927fjD984KIc0Kdj1!390BBa@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  },

  production: {
    root: rootPath,
    app: {
      name: 'messagesumo-email'
    },
    port: 3000,
    db: 'mongodb://admindb1484988:z927fjD984KIc0Kdj1!390BBa@candidate.53.mongolayer.com:10223,candidate.52.mongolayer.com:10634/messagesumo-email?replicaSet=set-560ded97f3ea5ebdda00018d'
  },

  googleApi: 'AIzaSyB6bcXvtyjWPSAT-aXZWNTTiwl_MfDNQiM', //messagesumo-email-checker
  googleCx: '006553027622961256205:kskdydpj1o0',
  mandrill: "3lLRQYVspHTIUmce9sIbZg",
  companyName: 'Message Sumo',
  companyPhone: '(425) 633-6351', //Current phone number in emails and other places.
  systemEmail: 'messagesumo@gmail.com',
  developerEmail: 'sean@messagesumo.com'
};

module.exports = config[env];
