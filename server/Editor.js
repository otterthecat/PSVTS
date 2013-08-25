var Editor = function(socket, fs, path){

    this.socket = socket;
    this.fs = fs;
    this.path = path;

    this.modes = {
        'js': 'javascript',
        'css': 'css',
        'less': 'less',
        'html': 'xml'
    };

    this.socket.on('save_document', function(doc){

        var content = doc.content;

        var stream = this.fs.createWriteStream(doc.path, {'flags': 'w'});
        stream.write(content);

        this.socket.emit('saved_doc', {saved: true});
    }.bind(this));

    this.socket.on('get_file', function(fileData){

        var the_file = fileData.file;
        this.fs.readFile(the_file, 'utf8', function(e, d){

            this.socket.emit('edit_file', {
              'file': the_file,
              'path': fileData.path,
              'mode': this.getMode.call(this, the_file),
              'content': d
            });
        }.bind(this));
    }.bind(this));
};

Editor.prototype = {

    'getMode': function(fileName){

        var extension = this.path.extname(fileName).substr(1);
        return this.modes[extension];
    }
};

module.exports = Editor;