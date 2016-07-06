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
//mongo candidate.52.mongolayer.com:10634/messagesumo-email -u adbrocks99 -pa14AbbJJ9dlkUi023jlsdf

var all = {
  googleApi: 'AIzaSyB6bcXvtyjWPSAT-aXZWNTTiwl_MfDNQiM', //messagesumo-email-checker
  googleCx: '006553027622961256205:kskdydpj1o0',
  mandrill: "3lLRQYVspHTIUmce9sIbZg",
  companyName: 'Gator Leads',
  companyPhone: '(425) 633-6351', //Current phone number in emails and other places.
  systemEmail: 'support@gatorleads.com',
  systemName: 'Rachel Swenson',
  developerEmail: 'sean@messagesumo.com',
  apiKey: 'UZE6pY5Yz6z3ektV:NEgYhceNtJaee3ga:H5TYvG57F2dzJF7G',
  privateProxyUsername: "s5",
  privateProxyPassword: "aukiej5ish",
  privateProxyRackUsername: "st362",
  privateProxyRackPassword: "748fyff8avqn",
  sendGrid: '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'
};

module.exports = _.assign(config[env], all);

//db.privateproxies.update({ provider: "proxyRack"}, { $set: { password: "748fyff8avqn"  }  }, { multi: true});

//mongo candidate.52.mongolayer.com:10634/messagesumo-email -u adbrocks99 -pa14AbbJJ9dlkUi023jlsdf
// db.proxies.remove({ created: { $lte:ISODate("2016-04-19T15:48:02.424Z") }})

/*
 {
 _id: ObjectId("57174c56dd958111008fe5f4"),
 ip: "189.90.34.186",
 port: NumberLong("29081"),
 type: NumberLong("5"),
 rnd: 0.9298582619521767,
 created: ISODate("2016-04-20T09:31:02.156Z"),
 isDead: false
 }
 */
