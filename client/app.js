// Create interface panel modules
/////////////////////////////////////
Panels.setSocket(socket);
Panels.topPanel.setPreviewToggle(document.querySelector('#appHeader button'), document.querySelector('#main') );
Panels.filesPanel.setDisplay(document.querySelector('#fileList'), socket);
Panels.filesPanel.emit('load_files', 'projects');
Panels.filesPanel.listen('return_file_data', function(data){

    Panels.filesPanel.generateDisplay(data.files);
});


// Have socket listen for event to
// create CodeMirror instance
/////////////////////////////////////
socket.on('edit_file', function(data){

    Editor.create('#codeMirror', data);
});