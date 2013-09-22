(function(){

    var Terminal = function(socket, selector){

        this.socket = socket;
        this.element = document.querySelector(selector);
        this.feedback = document.querySelector('.appFooter .terminalResponse');
        this.history = [];

        this.init();
    };


    Terminal.prototype = {

        init: function(){

            this.element.addEventListener('keydown', function(e){

                this.feedback.innerHTML = "";

                if(e.keyCode === 13){

                    this.pushCmd(this.element.value);
                }
            }.bind(this));

            this.socket.on('terminal_return', function(data){

                var output  = data.error ?  data.error : data.out;

                this.feedback.innerHTML = this.convertText(output);
            }.bind(this));
        },

        pushCmd: function(cmd){

            this.socket.emit('terminal_command', cmd);
            this.history.push(cmd);
            this.element.value = "";
        },

        getHistory: function(int){

            return this.history[int];
        },

        convertText: function(str){

            return str.replace(/\n/g, "<br/>");
        }
    };

    window.Terminal = Terminal;
})();