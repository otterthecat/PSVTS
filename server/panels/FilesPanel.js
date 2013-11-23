var path = require('path');
var fs   = require('fs');

var FilesPanel = function(socket){

    this.socket = socket;

    this.socket.on('load_files', function(directory){

        this.loadFiles.call(this, {'directory': directory});
    }.bind(this));

    this.socket.on('open_dir', function(dir){

        var dirPath = dir.directory;
        this.loadFiles.call(this, {'directory': dirPath, 'openDirectory': true});
    }.bind(this));
};

FilesPanel.prototype = {

    'loadFiles': function(params){

        var working_path = params.directory;

        // TODO - make this fully asyncrhonous!
        fs.readdir(working_path, function(error, files){

            var details = {};
            var fileList = files;

            for(var i = 0; i < fileList.length; i += 1){

                var _file = working_path + '/' + fileList[i];
                var is_dir = fs.statSync(_file).isDirectory();

                details[_file] = {
                  'type': is_dir,
                  'content': is_dir ? null : fs.readFileSync(_file, 'utf8')
                };

                if(is_dir){

                  details[_file].state = 'closed';
                }
            }

            if(params.openDirectory) {

                this.socket.emit('return_dir_content', {'files': details});
            } else {

                this.socket.emit('return_file_data', {'files': details});
            }

        }.bind(this));
    }
};

module.exports = FilesPanel;