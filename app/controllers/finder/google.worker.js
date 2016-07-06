process.on('message', function(fn) {
  // Do work  (in this case just up-case the string
  fn.then(function(data){
    process.send(data); //send back to parent;
  })
});
