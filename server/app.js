var io = require('socket.io').listen(4000);

var configs = require('./configs/configs').dependencies;
var DL = require('./DependencyLoader');
var Panels = require('./Panels');
var Editor = require('./Editor');
var Terminal = require('./Terminal');
var User = require('./db/UserModel');


io.sockets.on('connection', function(socket){

    var deps = new DL(configs);
    deps.loadDependencies();

    var panels = new Panels();
    panels.loadPanels();

    var filesPanel = panels.getInstance('FilesPanel', {
        'socket': socket,
        'fs': deps.get('fs'),
        'path': deps.get('path')
    });

    var previewPanel = panels.getInstance('PreviewPanel', {
        'socket': socket,
        'fs': deps.get('fs')
    });

    previewPanel.watch();

    var editor = new Editor(deps.get('fs'), deps.get('path'));
    editor.addRelay(socket);
    socket.on('get_file', function(data){

        editor.emit('get_file', data);
    })
    .on('save_document', function(data){

        editor.emit('save_document', data);
    });

    var terminal = new Terminal(deps.get('child_process'));
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