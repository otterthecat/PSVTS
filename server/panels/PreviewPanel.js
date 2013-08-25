var PreviewPanel = function(opts){

    this.socket = opts.socket;
    this.fs = opts.fs;

};

PreviewPanel.prototype = {

    watch: function(){


        this.fs.watch('projects/', function(){

            this.socket.emit('update_files', {'updated': true});
        }.bind(this));
    }
};

module.exports = PreviewPanel;