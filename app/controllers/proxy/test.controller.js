var Socks = require('socks');

function createSocketConnection(){
    console.log('create connection')
    var proxy = {
      ip: "vps77691.vps.ovh.ca",
      port: 18280,
      type: 5
    };
    var username = "s5";
    var password = "s55";

    var options = {
      proxy: {
        ipaddress: proxy.ip, // Random public proxy
        port: proxy.port,
        type: proxy.type, // type is REQUIRED. Valid types: [4, 5]  (note 4 also works for 4a)
        //userid: username + ":" + password
        authentication: {
         username: username,
         password: password
         }
      },
      target: {
        host: "google.com", // can be an ip address or domain (4a and 5 only)
        port: 80
      },
      command: 'connect'  // This defaults to connect, so it's optional if you're not using BIND or Associate.
    };

    Socks.createConnection(options, function (err, socket, info) {
      if (err) {
        console.log('failed to connect');
        console.log(err);
      } else {
        socket.write('HELO \r\n');

        socket.on('data', function (data) {
          console.log(data)
          console.log('data');
        });
        socket.on('close', function () {
          console.log('Client disconnected from proxy');

        });

        socket.on('error', function (err) {
          console.log('error');
          socket.destroy();
        });
        // PLEASE NOTE: sockets need to be resumed before any data will come in or out as they are paused right before this callback is fired.
        socket.resume();
      }
    });
}

createSocketConnection();

