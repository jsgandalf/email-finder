var controller = require('./google.controller');
var Bluebird = require('bluebird');
  require('bluebird').config({
  cancellation: true
});
var cancelSome = require('../../utils/cancel-some');

/*var cp = require('child_process');
var child = cp.fork('./worker');*/

/*child.on('message', function(m) {
  // Receive results from child process
  console.log('received: ' + m);
});*/

var proxy = {
  ip: "108.59.14.208",
  port: 13010,
  username: null,
  password: null
}

//Ask nate about this
return cancelSome.getFirst([
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy),
  controller.tryGoogle("premera blue cross", proxy)
]).then(function(first){
  return first;
}).then(function(){
  console.log('done');
}).catch(Bluebird.AggregateError, function(err) {
  err.forEach(function(e) {
    console.error(e.stack);
  });
});

// Send child process some work
/*child.send(controller.tryGoogle("premera blue cross", proxy));
child.send(controller.tryGoogle("premera blue cross", proxy));
child.send(controller.tryGoogle("premera blue cross", proxy));
child.send(controller.tryGoogle("premera blue cross", proxy));
child.send(controller.tryGoogle("premera blue cross", proxy));*/







//controller.tryGoogle("premera blue cross", proxy).done();

