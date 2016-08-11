var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring');
var util = require('util');
var Bluebird = require('bluebird');

var ProfileClass = require("./data-containers/profile");
var Experience = require("./data-containers/experience");
var Honors = require("./data-containers/honors");
var Project = require("./data-containers/projects");
var Education = require("./data-containers/education");


var scrape = function (body) {

  var $ = cheerio.load(body);
  var profile = new ProfileClass();
  profile.name = $("#name").text();
  console.log(profile.name)
  profile.headline = $("p.headline[data-section='headline']").text();
  profile.location = $("span.locality").text();
  profile.current = $("tr[data-section='currentPositionsDetails'] td").text();
  $("tr[data-section='pastPositionsDetails'] td").each(function() {
    var company = $(this).text();
    company = company.split(",")[0];
    profile.past.push(company);
  });

  profile.education = $("tr[data-section='educationsDetails'] td").text();
  $("tr[data-section='websites'] td").each(function() {
    profile.websites.push($(this).find("a[href]").attr("href"));
  });

  $("tr[data-section='educationsDetails'] td ol li").each(function() {
    profile.educationlist.push(new Education($(this).text()));
  });

  return Bluebird.resolve(profile);

}

module.exports = scrape;
