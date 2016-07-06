process.on('message', function(m) {
  // Do work  (in this case just up-case the string
  var timeout = setTimeout(function(){ console.log(m)}, m);

  // Pass results back to parent process
  process.send(m);
});
