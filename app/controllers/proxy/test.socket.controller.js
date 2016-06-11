var Bluebird = require('bluebird');
var net = require('net');

function createSocketConnection(HOST, PORT) {
  console.log('entering promise')
  var responseData = '';
  return new Bluebird(function (resolve, reject) {
    var client = new net.Socket();
    client.connect(PORT, HOST, function(err) {
      if (err) {
        console.log('failed to connect to ' + HOST);
        console.log(err);
        reject('failed to connect');
      } else {
        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        client.write('EHLO google.com\r\n');
        client.write("QUIT\r\n");
      }
    });

    client.on('data', function (data) {
      data = data.toString("utf-8");
      responseData += data;
      console.log(data);
    });
    client.on('close', function () {
      resolve(true);
      client.destroy();
      //console.log('Client disconnected from proxy');
    });

    client.on('error', function (err) {
      reject(err);
      //console.log('My Error: ' + err.toString());
      client.destroy();
    });

  });
}


return createSocketConnection('74.125.69.27', '25').catch(function(err){
  console.log(err);
});
