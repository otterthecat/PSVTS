// define the socket
var socket = io.connect('http://localhost:4000');

Panels.setSocket(socket);
Panels.topPanel.setPreviewToggle(document.querySelector('#appHeader button'), document.querySelector('.app') );
Panels.filesPanel.setDisplay(document.querySelector('#fileList'), socket);
Panels.filesPanel.emit('load_files', 'projects');
Panels.filesPanel.listen('return_file_data', function(data){

    console.log("returned data ");
    console.log(data);
});