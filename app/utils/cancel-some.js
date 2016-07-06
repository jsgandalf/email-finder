'use strict';

var Bluebird = require('bluebird');
Bluebird.config({cancellation: true});

exports.getFirst = getFirst;

function getFirst(promises) {
  return new Promise(function(resolve, reject) {
    var cancelled = false;
    var numRejected = 0;
    promises.forEach(function(promise) {
      promise.then(runResolve, runReject);
    });
    function runResolve(result) {
      cancelOthers();
      resolve(result);
    }
    function runReject(error) {
      if(++numRejected === promises.length) {
        cancelOthers();
        reject(error);
      }
    }
    function cancelOthers() {
      if(!cancelled) {
        cancelled = true;
        promises.forEach(function(promise) {
          promise.cancel && promise.cancel();
        });
      }
    }
  });
}

function delay(ms, shouldReject) {
  return new Promise(function(resolve, reject, onCancel) {
    var timeout = setTimeout(function() {
      alert('resolve: ' + ms);
      shouldReject ? reject(ms) : resolve(ms);
    }, ms);
    onCancel(function() {
      alert('cancelling');
      clearTimeout(timeout);
    });
  });
}

/*function promises() {
  return [
    delay(500, false),
    delay(100, true),
    delay(600, true),
  ]
}


return getFirst(promises())
  .then(function(a) {
    alert('done: ' + a);
  }).catch(function(error) {
    alert('Error: ' + error);
  });*/


