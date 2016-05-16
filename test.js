var reflectMap = require('./app/utils/reflect-map');

var coll = [1,2,3,4,5,6,6,7,8,9,10,11,12]

reflectMap.reflectMapWait(coll,function(data){
  console.log(data);
});
