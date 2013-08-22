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
            console.log("INIT");
            this.socket.on('terminal_return', function(data){
                console.log("RETURNED");
                var target = document.querySelector('#appFooter .terminalResponse');
                var output  = data.error ?  data.error : data.out;

                target.innerHTML = output;
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