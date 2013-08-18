var socketConfig = {

    // any modules requred for listener callbacks
    dependencies: ['fs', 'path'],

    // functions that can be shared across listener callbacks
    utils: {

        'loadFiles': function(params){

            var _this = this;
            var working_path = params.directory;
            var fs = this.deps.fs;

            // TODO - make this fully asyncrhonous!
            fs.readdir(working_path, function(error, files){

                var details = {};
                var fileList = files;

                for(var i = 0; i < fileList.length; i += 1){

                    var _file = fileList[i];
                    var is_dir = fs.statSync(working_path + '/' + _file).isDirectory();

                    details[_file] = {
                      'type': is_dir,
                      'content': is_dir ? null : fs.readFileSync(working_path + '/' + _file, 'utf8')
                    }
                }

                if(params.openDirectory) {

                    _this.emit('return_dir_content', {'files': details, 'path': working_path});
                } else {

                    _this.emit('return_file_data', {'files': details, 'path': working_path});
                }

            });
        },

        'getMode': function(fileName){

            var modes = {
              'js': 'javascript',
              'css': 'css',
              'less': 'less',
              'html': 'xml'
            };

            var extension = this.deps.path.extname(fileName).substr(1);
            return modes[extension];
        }
    },

    // map of events for io socket to listen to with value of callback
    listeners: {

        'open_dir': function(dir){

          var dirPath = dir.directory;
          this.utils.loadFiles.call(this, {'directory': dirPath, 'openDirectory': true});
        },

        'save_document': function(document){

            var content = document.content;

            var stream = this.deps.fs.createWriteStream(document.path, {'flags': 'w'});
            stream.write(content);

            this.emit('saved_doc', {saved: true});
        },

        'get_file': function(fileData){

            var the_file = fileData.file;
            var _this = this;
            _this.deps.fs.readFile(the_file, 'utf8', function(e, d){

                _this.emit('edit_file', {
                  'file': the_file,
                  'path': fileData.path,
                  'mode': _this.utils.getMode.call(_this, the_file),
                  'content': d
                });
            });
        },

        'load_files': function(directory){

            this.utils.loadFiles.call(this, {'directory': directory});
        }
    }
}


exports.config = socketConfig;