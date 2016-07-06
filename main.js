var cp = require('child_process');
var child = cp.fork('./worker');

child.on('message', function(m) {
  // Receive results from child process
  console.log('received: ' + m);
});

// Send child process some work
child.send(1000);
child.send(2000);
child.send(3000);
child.send(4000);
child.send(4000);
