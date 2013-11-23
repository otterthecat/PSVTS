var io = require('socket.io').listen(4000);

var Panels = require('./Panels');
var Editor = require('./Editor');
var Terminal = require('./Terminal');
var User = require('./db/UserModel');


io.sockets.on('connection', function(socket){

    var panels = new Panels();
    panels.loadPanels();

    var filesPanel = panels.getInstance('FilesPanel', socket);

    var previewPanel = panels.getInstance('PreviewPanel');
    previewPanel.addRelay(socket);
    previewPanel.watch();

    var editor = new Editor();
    editor.addRelay(socket);
    socket.on('get_file', function(data){

        editor.emit('get_file', data);
    })
    .on('save_document', function(data){

        editor.emit('save_document', data);
    });

    var terminal = new Terminal();
    terminal.addRelay(socket);
    socket.on('terminal_command', function(data){

        terminal.emit('terminal_command', data);
    });

    socket.on('login', function(data){

        var user = new User(data);
        user.save(function(err, usr, numAffected){

            if(err){

                socket.emit('login_error', err);
            } else {

                socket.emit('login_created', usr);
            }
        });
    });
});