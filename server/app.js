var io = require('socket.io').listen(4000);

var configs = require('./configs/configs').dependencies;
var DL = require('./DependencyLoader');
var Panels = require('./Panels');
var Editor = require('./Editor');
var Terminal = require('./Terminal');


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

    var editor = new Editor(socket, deps.get('fs'), deps.get('path'));

    var terminal = new Terminal(deps.get('child_process'), socket);
});