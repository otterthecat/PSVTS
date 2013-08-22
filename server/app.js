var io = require('socket.io').listen(4000);
var config = require('./SocketConfig');
var sServer = require('./SocketServer');
var Terminal = require('./Terminal');

io.sockets.on('connection', function(socket){

    var app = new sServer(socket, config);
    app.loadDependencies().listen();

    var terminal = new Terminal(app.deps.child_process, socket);
});