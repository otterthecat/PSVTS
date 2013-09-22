// Import
/////////////////////////////////////
var socket = require('./socket').socket;
var Editor = require('./Editor');
var Panels = require('./Panels').Panels;
var Terminal = require('./Terminal');

var editor = new Editor(CodeMirror, socket);


// Create interface panel modules
/////////////////////////////////////
Panels.setSocket(socket);
Panels.topPanel.setSocket(socket)
    .setPreviewToggle(document.querySelector('.appHeader [data-menu="preview"]'), document.querySelector('.main') );
Panels.filesPanel.setDisplay(document.querySelector('.fileList'), socket);
Panels.filesPanel.emit('load_files', 'projects');
Panels.filesPanel.listen('return_file_data', function(data){

    Panels.filesPanel.generateDisplay(data.files);
})
.listen('update_files', function(data){

    var iframe = document.querySelector('iframe');
    iframe.contentWindow.location.reload();
});


// Terminal
// /////////////////////////////////////
var terminal = new Terminal(socket, '#console');