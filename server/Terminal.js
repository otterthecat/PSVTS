var Relay = require('./Relay');
var util  = require('util');
var cp    = require('child_process');

var Terminal = function(){

    Relay.call(this);
    this.allowedCommands = {
        'ls': 'ls',
        'touch': 'touch',
        'mkdir': 'mkdir'
    };

    this.init();
};

util.inherits(Terminal, Relay);

Terminal.prototype.init =function(){

    this.on('terminal_command', function(data){

        this.process(data);
    });
};

Terminal.prototype.parse = function(str){

    var cmdArray = str.split(" ");
    var parsedCmd = cmdArray.shift();
    var parsedParams = cmdArray.join(" ");

    return {
        cmd: parsedCmd,
        params: parsedParams
    };
};

Terminal.prototype.process = function(cmd){

    var pCmd = this.parse(cmd);

    if(this.allowedCommands.hasOwnProperty(pCmd.cmd)) {

        return cp.exec(pCmd.cmd + " " + pCmd.params, function(error, stdout, stderror){

            // return call included for testing until better mocking solution
            return this.runRelays('terminal_return', {'out': stdout, 'error': stderror});
        }.bind(this));
    } else {

        return false;
    }
};

module.exports = Terminal;