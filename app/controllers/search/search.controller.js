var google = require('../../google/queryGoogle');
var Bluebird = require('bluebird');
var cancelSome = require('../../utils/cancel-some');

function tryGoogle(query, proxy){
  return new Bluebird(function(resolve, reject, onCancel){
    var aborter = google(proxy.username, proxy.password, proxy.ip, proxy.port, query, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
    onCancel(aborter);
  });
}

function getResults(query, retry) {
  if(typeof retry == 'undefined' || retry == null){
    retry = 0;
  }
  var proxy = {
    ip: "108.59.14.208",
    port: 13010,
    username: null,
    password: null
  };
  return cancelSome.getFirst([
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy),
    tryGoogle(query,proxy)
  ]).then(function (data) {
    console.log(data)
    return data;
  }).catch(function(err) {
    retry += 1;
    if (retry < 2) {
      return getResults(query, retry);
    }
  });
}

var query = 'site:www.linkedin.com/in/* OR site:www.linkedin.com/pub/* -inurl:"dir/+" -intitle:"profiles" "Real estate agent"';

var proxy = {
  ip: "108.59.14.208",
  port: 13010,
  username: null,
  password: null
};

tryGoogle(query,proxy);

exports.index = function(req, res){
  return getResults(req.body.query, 0).then(function(data){
    console.log(data);
    return res.json(data);
  }).catch(function(err){
    console.log(err);
    return res.status(500).json(err);
  });
};
