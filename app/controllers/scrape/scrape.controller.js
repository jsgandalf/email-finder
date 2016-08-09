var scrape = require('../../google/scrape');
var Bluebird = require('bluebird');
var cancelSome = require('../../utils/cancel-some');

function tryScrape(url, proxy){
  return new Bluebird(function(resolve, reject, onCancel){
    var aborter = scrape(proxy.username, proxy.password, proxy.ip, proxy.port, url, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
    onCancel(aborter);
  });
}

function getResults(url, retry) {
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
    tryScrape(url,proxy),
    tryScrape(url,proxy),
    tryScrape(url,proxy)
  ]).then(function (data) {
    console.log(data);
    return data;
  }).catch(function(err) {
    retry += 1;
    if (retry < 2) {
      return getResults(url, retry);
    }
  });
}

//var query = 'site:www.linkedin.com/in/* OR site:www.linkedin.com/pub/* -inurl:"dir/+" -intitle:"profiles" "Real estate agent"';

var proxy = {
  ip: "108.59.14.208",
  port: 13010,
  username: null,
  password: null
};

//tryGoogle(query,proxy);

exports.index = function(req, res){
  return getResults("www.linkedin.com/in/realtor-real-estate-agent-samii-6121165a").then(function(data){
    console.log(data)
    return res.json(data);
  }).catch(function(err){
    console.log(err);
    return res.status(500).json(err);
  });
};
