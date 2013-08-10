var io = require('socket.io').listen(4000);
var fs = require('fs');
var fpath = require('path');
var working_file = null;
io.sockets.on('connection', function(socket){

var modes = {
    'js': 'javascript',
    'css': 'css',
    'less': 'less',
    'html': 'xml'
}

var getMode = function(modeObj, fileName){

  var extension = fpath.extname(fileName).substr(1);

  return modes[extension];
}

 fs.watch('projects/', function(){

    socket.emit('update_files', {'updated': true});
  });


  socket.on('load_files', function(dir){

    working_path = dir;

    fs.readdir(working_path, function(error, files){

      var details = {};
      var fileList = files;


      for(var i = 0; i < fileList.length; i += 1){

          details[fileList[i]] = fs.readFileSync(working_path + '/' + fileList[i], 'utf8');
      }

        socket.emit('return_file_data', {'files': details, 'path': working_path});

    });
  });

  socket.on('getFile', function(fileData){

    var the_file = fileData.file;
    fs.readFile(fileData.path + '/' + the_file, 'utf8', function(e, d){

      socket.emit('edit_file', {
        'file': the_file,
        'path': fileData.path,
        'mode': getMode(modes, the_file),
        'content': d
      })
    });
  });


  socket.on('save_document', function(document){

    var content = document.content;

    var stream = fs.createWriteStream(document.path, {'flags': 'w'});
    stream.write(content);

    socket.emit('saved_doc', {saved: true});
  });
});