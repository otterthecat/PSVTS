var Terminal = function(cp, socket){

    this.socket = socket;
    this.childProcess = cp;
    this.allowedCommands = {
        'ls': 'ls',
        'touch': 'touch',
        'mkdir': 'mkdir'
    };

    this.socket.on('terminal_command', function(data){

        this.process(data);
    }.bind(this));
};

Terminal.prototype = {

    parse: function(str){

        var cmdArray = str.split(" ");
        var parsedCmd = cmdArray.shift();;
        var parsedParams = cmdArray.join(" ");

        return {
            cmd: parsedCmd,
            params: parsedParams
        }
    },

    process: function(cmd){

        var pCmd = this.parse(cmd);

        if(this.allowedCommands.hasOwnProperty(pCmd.cmd)) {

            this.childProcess.exec(pCmd.cmd + " " + pCmd.params, function(error, stdout, stderror){

                    this.socket.emit('terminal_return', {'out': stdout, 'error': stderror});
            }.bind(this));
        } else {

            this.socket.emit('terminal_return', {'out': 'null', 'error': 'command not allowed'});
        }
    }
}



exports.Terminal = Terminal;