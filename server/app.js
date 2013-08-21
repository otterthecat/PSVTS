var io = require('socket.io').listen(4000);
var config = require('./SocketConfig').config;
var sServer = require('./SocketServer').SocketServer;
var Terminal = require('./Terminal').Terminal;

io.sockets.on('connection', function(socket){

    var app = new sServer(socket, config);
    app.loadDependencies().listen();

    var terminal = new Terminal(app.deps.child_process, socket);
});