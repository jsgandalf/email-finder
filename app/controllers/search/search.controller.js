var google = require('../../google/queryGoogle');
var Bluebird = require('bluebird');
var cancelSome = require('../../utils/cancel-some');

function tryGoogle(query, proxy, startIndex){
  return new Bluebird(function(resolve, reject, onCancel){
    if(!startIndex){
      startIndex = 0;
    }
    var aborter = google(proxy.username, proxy.password, proxy.ip, proxy.port, query, startIndex, function (err, res) {
      if (err) {
        reject(err);
      } else if (res.links.length < 1) {
        reject('Could not google search');
      } else {
        resolve(res.links);
      }
    });
    onCancel(aborter);
  });
}

function getResults(query, start, retry) {
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
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start),
    tryGoogle(query,proxy, start)
  ]).then(function (data) {
    return data;
  }).catch(function(err) {
    retry += 1;
    if (retry < 2) {
      return getResults(query, start, retry);
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
  console.log(req.body.query)
  return getResults(req.body.query, req.body.start, 0).then(function(data){
    return res.json(data);
  }).catch(function(err){
    console.log(err);
    return res.status(500).json(err);
  });
};
