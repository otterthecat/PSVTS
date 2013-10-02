var Relay = require('./Relay');
var util = require('util');

var Editor = function(fs, path){

    Relay.call(this);
    this.fs = fs;
    this.path = path;

    this.modes = {
        'js': 'javascript',
        'css': 'css',
        'less': 'less',
        'html': 'xml'
    };

    this.init();
};

util.inherits(Editor, Relay);

Editor.prototype.init = function(){

    this.on('save_document', function(doc){

        var content = doc.content;

        var stream = this.fs.createWriteStream(doc.path, {'flags': 'w'});
        stream.write(content);

        this.runRelays('saved_doc', {saved: true});
    });

    this.on('get_file', function(fileData){

        var the_file = fileData.file;
        this.fs.readFile(the_file, 'utf8', function(e, d){

            this.runRelays('edit_file', {
              'file': the_file,
              'path': fileData.path,
              'mode': this.getMode.call(this, the_file),
              'content': d
            });
        }.bind(this));
    });
};

Editor.prototype.getMode = function(fileName){

    var extension = this.path.extname(fileName).substr(1);
    return this.modes[extension];
};

module.exports = Editor;