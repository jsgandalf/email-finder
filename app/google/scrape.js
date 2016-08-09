var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring');
var util = require('util');

var linkSel = 'h3.r a'
var descSel = 'div.s'
var itemSel = 'div.g'
var nextSel = 'td.b a span'


var scrape = function (user, password, host, port, url, callback) {

  var requestOptions = {
    url: url,
    method: 'GET'
  };

  requestOptions.tunnel = true;
  requestOptions.headers = {
    //'User-Agent': agent,
    "Cache-Control" : "no-cache"
  };
  requestOptions.proxy = "http://" + host + ":" + port;
  if(user != null && password != null) {
    requestOptions.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(user + ':' + password).toString('base64');
  }

  var reqObject = request(requestOptions, function (err, resp, body) {
    if ((err == null) && resp.statusCode === 200) {
      var $ = cheerio.load(body)
      var res = {
        url: newUrl,
        query: query,
        start: start,
        links: [],
        $: $,
        body: body
      }

      /*var redirect = $('span.spell + a').attr('href');
      if(typeof redirect != 'undefined'){
        //redirect = redirect.replace('/search?q=', '');
        igoogle(user, password, host, port, query, start, callback, redirect);
      }else {

        $(itemSel).each(function (i, elem) {
          var linkElem = $(elem).find(linkSel)
          var descElem = $(elem).find(descSel)
          var item = {
            title: $(linkElem).first().text(),
            link: null,
            description: null,
            href: null
          }
          var qsObj = querystring.parse($(linkElem).attr('href'))

          if (qsObj['/url?q']) {
            item.link = qsObj['/url?q']
            item.href = item.link
          }

          $(descElem).find('div').remove()
          item.description = $(descElem).text()

          res.links.push(item)
        })

        if ($(nextSel).last().text() === google.nextText) {
          res.next = function () {
            igoogle(query, start + google.resultsPerPage, callback)
          }
        }*/
        callback(null, res);
      //}
    } else {
      callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
    }
  });
  return function(){ reqObject.abort(); };
}

module.exports = scrape;
