(function(){

    var Terminal = function(socket, selector){

        this.socket = socket;
        this.element = document.querySelector(selector);
        this.history = [];

        this.init();
    };


    Terminal.prototype = {

        init: function(){

            this.element.addEventListener('keydown', function(e){

                if(e.keyCode === 13){

                    this.pushCmd(this.element.value);
                }
            }.bind(this));
        },

        pushCmd: function(cmd){

            this.socket.emit('terminal_command', cmd);
            this.history.push(cmd);
            this.element.value = "";
        },

        getHistory: function(int){

            return this.history[int];
        }
    };

    window.Terminal = Terminal;
})();