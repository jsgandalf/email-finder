var _ = require('lodash');
var Q = require('q');
var Bluebird = require('bluebird');

function reflectMapWait(collection, fn) {
  Bluebird.map(collection, function(item, i) { return Bluebird.delay(i * 1000).then(function() { return foo(item); }); });
}

function foo(){
  console.log('doing');
  var defer = Q.defer();
  setTimeout(function(){ defer.resolve(true)}, 10000);
  return defer.promise;
}

var coll = [1,2,3,4,5]

reflectMapWait(coll,function(data){
  console.log(data);
});

