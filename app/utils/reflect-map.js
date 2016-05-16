'use strict';
var _ = require('lodash');
var Bluebird = require('bluebird');
var Q = require('q');

exports.reflectMap = reflectMap;
exports.reflectMapWait = reflectMapWait;

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

function minDelay(promise, delay) {
  Bluebird.all([promise, Bluebird.delay(delay)]).get(0);
}

function setDelay(fn, interval){
  var deferred = Q.defer();
  setTimeout(function(){ deferred.resolve(fn) }, interval);
  return deferred.promise;
}

function reflectMapWait(collection, fn) {
  var promises = _.map(collection, function(val){
    return setDelay(fn(val), 1000);
  });
  console.log(promises)
  return promises;
  /*return _.map(collection, function(val) {
    return minDelay(fn(val), 1000)
  });*/
}
