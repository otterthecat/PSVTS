(function(){

    var Terminal = function(){

        this.element = null;
        this.commands = {};
    };


    Terminal.prototype = {


        setInput: function(sel){

            this.element = document.querySelector(sel);
            return this;
        },

        addCommand: function(name, callback){

            this.commands[name] = callback;

            this.element.addEventListener(name, function(e){

                callback(e, this);
            });
        }
    };

    window.Terminal = Terminal;
})();