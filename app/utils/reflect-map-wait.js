'use strict';

var Bluebird = require('bluebird');

module.exports = reflectMapWait;

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function reflectMapWait(collection, fn) {
  return Bluebird.map(collection, function (val, i) {
    return Bluebird.delay(i * (500 + getRandom(500,1000))).then(function() {
      return Bluebird.try(function () {
        return fn(val);
      }).then(null, function (error) {
        console.log('error in reflect map', error, error.stack);
      });
    });
  });
}
