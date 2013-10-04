var Relay = require('../Relay');
var util = require('util');

var PreviewPanel = function(opts){

    Relay.call(this);
    this.fs = opts.fs;

};

util.inherits(PreviewPanel, Relay);

PreviewPanel.prototype.watch = function(){


    this.fs.watch('projects/', function(){

        this.runRelays('update_files', {'updated': true});
    }.bind(this));

};

module.exports = PreviewPanel;