var Relay = require('../Relay');
var util  = require('util');
var fs    = require('fs');

var PreviewPanel = function(){

    Relay.call(this);
};

util.inherits(PreviewPanel, Relay);

PreviewPanel.prototype.watch = function(){


    fs.watch('projects/', function(){

        this.runRelays('update_files', {'updated': true});
    }.bind(this));

};

module.exports = PreviewPanel;