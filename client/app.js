// Create interface panel modules
/////////////////////////////////////
Panels.setSocket(socket);
Panels.topPanel.setPreviewToggle(document.querySelector('#appHeader button'), document.querySelector('#main') );
Panels.filesPanel.setDisplay(document.querySelector('#fileList'), socket);
Panels.filesPanel.emit('load_files', 'projects');
Panels.filesPanel.listen('return_file_data', function(data){

    Panels.filesPanel.generateDisplay(data.files);
});


// Terminal
// /////////////////////////////////////
var terminal = new Terminal();
terminal.setInput('#console');
terminal.addCommand('keydown', function(event, element){

    console.log(event);
    console.log(element);
});


// Have socket listen for event to
// create CodeMirror instance
/////////////////////////////////////
socket.on('edit_file', function(data){

    Editor.create('#codeMirror', data);
});

socket.on('update_files', function(data){

    var iframe = document.querySelector('iframe');
    iframe.contentWindow.location.reload();
});