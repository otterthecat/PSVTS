var Relay = require('./Relay');
var util  = require('util');
var fs    = require('fs');
var path  = require('path');

var Editor = function(){

    Relay.call(this);

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

        var writeStream = fs.createWriteStream(doc.path, {'flags': 'w'});
        writeStream.write(content);

        this.runRelays('saved_doc', {saved: true});
    });

    this.on('get_file', function(fileData){

        var the_file = fileData.file;
        var readStream = fs.createReadStream(the_file, {'flags': 'r'});
        readStream.setEncoding('utf8');
        readStream.on('data', function(chunk){

            this.runRelays('edit_file', {
              'file': the_file,
              'path': fileData.path,
              'mode': this.getMode.call(this, the_file),
              'content': chunk
            });
        }.bind(this));
    });
};

Editor.prototype.getMode = function(fileName){

    var extension = path.extname(fileName).substr(1);
    return this.modes[extension];
};

module.exports = Editor;