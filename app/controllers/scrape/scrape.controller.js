var scrape = require('../../google/scrape');
var Bluebird = require('bluebird');
var cancelSome = require('../../utils/cancel-some');
var phantom = require('phantom');

function getProfileHtml(url){
  var sitepage = null;
  var phInstance = null;

  return phantom
    .create(["--proxy=108.59.14.208:13010", "--proxy-type=http"])
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
  return getProfileHtml(req.body.url).then(function(data) {
    return scrape(data)
  }).then(function(data){
    console.log(data);
    return res.json(data);
  }).catch(function(err){
    console.log(err);
    return res.status(500).json(err);
  });
};
