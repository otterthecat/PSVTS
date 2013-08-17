var io = require('socket.io').listen(4000);
var config = require('./SocketConfig').config;
var sServer = require('./SocketServer').SocketServer;

io.sockets.on('connection', function(socket){

    var app = new sServer(socket, config);
    app.loadDependencies().listen();
});