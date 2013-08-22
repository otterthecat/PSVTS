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
var terminal = new Terminal(socket, '#console');


// Have socket listen for event to
// update preview iframe
/////////////////////////////////////
socket.on('update_files', function(data){

    var iframe = document.querySelector('iframe');
    iframe.contentWindow.location.reload();
});