'use strict';
var _ = require('lodash');
var Bluebird = require('bluebird');
var Q = require('q');

module.exports = reflectMap;

function reflectMap(collection, fn, concurrency) {
  var concurrency = concurrency || 1;
  return Bluebird.map(collection, function(val) {
    return Bluebird.try(function() {
      return fn(val);
    }).then(null, function(error) {
      console.log('error in reflect map', error, error.stack);
    });
  }, {concurrency: concurrency});
}
