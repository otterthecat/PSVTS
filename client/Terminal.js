var Terminal = function(socket, selector){

    this.socket = socket;
    this.element = document.querySelector(selector);
    this.feedback = document.querySelector('.appFooter .terminalResponse');
    this.history = [];

    this.init();
};


Terminal.prototype = {

    init: function(){

        this.applyTriggerEvent();
        this.socket.on('terminal_return', this.onDataReturn.bind(this));
    },

    applyTriggerEvent: function(){

        this.element.addEventListener('keydown', function(e){

            this.feedback.classList.remove('show');
            this.feedback.innerHTML = "";

            if(e.keyCode === 13){

                this.pushCmd(this.element.value);
            }
        }.bind(this));
    },

    onDataReturn: function(data){

        var output  = data.error ?  data.error : data.out;
        this.feedback.classList.add('show');
        this.feedback.innerHTML = this.convertText(output);
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

module.exports = Terminal;