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


var coll = [1,2,3,4,5,6,6,7,8,9,10,11,12]

reflectMap.reflectMapWait(coll,function(data){
  console.log(data);
});

