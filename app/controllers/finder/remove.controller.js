var Proxy = require('../../models/proxy');

exports.removeOldProxies = function(req, res){
  var today = new Date();
  today.setDate(today.getDate()-1);
  return Proxy.remove({ created: { $lte: today }}).exec().then(function(){
    return res.send(200);
  }, function(){
    return res.send(500);
  });
};
