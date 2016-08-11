var scrape = require('../../google/scrape');
var Bluebird = require('bluebird');
var cancelSome = require('../../utils/cancel-some');
var phantom = require('phantom');

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

function getProfileHtml(url){
  var sitepage = null;
  var phInstance = null;

  return phantom
    .create(["--proxy=108.59.14.208:15124", "--proxy-type=http"])
    .then(function(instance) {
      phInstance = instance;
      return instance.createPage();
    })
    .then(function(page) {
      sitepage = page;
      page.setting('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.84 Safari/537.36');
      return page.open(url);
    })
    .then(function(status) {
      console.log(status)
      return sitepage.property('content');
    })
    .then(function (body) {
      sitepage.close();
      phInstance.exit();
      return body;
    })
    .catch(function(err) {
      console.log(err);
      phInstance.exit();
      throw err;
    });
}

exports.index = function(req, res){
  return getProfileHtml(req.body.url).then(function(data){
    console.log(data)
    return res.json(data);
  }).catch(function(err){
    console.log(err);
    return res.status(500).json(err);
  });
};
