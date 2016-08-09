var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring');
var util = require('util');

var linkSel = 'h3.r a'
var descSel = 'div.s'
var itemSel = 'div.g'
var nextSel = 'td.b a span'

var URL = 'https://www.google.%s/search?hl=%s&q=%s&start=%s&sa=N&num=%s&ie=UTF-8&oe=UTF-8&gws_rd=ssl'

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.'

// start parameter is optional
function google (user, password, host, port, query, start, callback) {
  var startIndex = 0;
  if (typeof start != 'undefined') {
    startIndex = start
  }
  return igoogle(user, password, host, port, query, startIndex, callback)
}

google.resultsPerPage = 10;
google.tld = 'com'
google.lang = 'en'
google.requestOptions = {}
google.nextText = 'Next'

var igoogle = function (user, password, host, port, query, start, callback, redirectUrl) {
  if (google.resultsPerPage > 100) google.resultsPerPage = 100 // Google won't allow greater than 100 anyway
  if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg)

  // timeframe is optional. splice in if set
  if (google.timeSpan) {
    URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + google.timeSpan) : URL.concat('&tbs=qdr:', google.timeSpan)
  }

  var newUrl = util.format(URL, google.tld, google.lang, querystring.escape(query), start, google.resultsPerPage)
  if(typeof redirectUrl != 'undefined'){
    newUrl = 'https://www.google.com' + redirectUrl;
  }
  var requestOptions = {
    url: newUrl,
    method: 'GET'
  }
  console.log(newUrl)

  for (var k in google.requestOptions) {
    requestOptions[k] = google.requestOptions[k]
  }
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

      var redirect = $('span.spell + a').attr('href');
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
        }
        callback(null, res)
      }
    } else {
      callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
    }
  });
  return function(){ reqObject.abort(); };
}

module.exports = google;
