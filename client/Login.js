(function(){

    var Login = function(socket){

        this.socket     = socket;

        this.form       = document.querySelector('.login');
        this.name       = this.form.querySelector('input[type="name"]');
        this.email      = this.form.querySelector('input[type="email"]');
        this.password   = this.form.querySelector('input[type="password"]');

        this.init();

        this.socket.on('login_error', function(data){

            this.showError(data);
        }.bind(this));
    };


    Login.prototype = {

        init: function(){

            var _this = this;

            this.form.addEventListener('submit', function(event){

                event.preventDefault();

                var details = {
                    name: this.name.value,
                    email: this.email.value,
                    password: this.password.value
                }

                _this.socket.emit('login', details);
            });
        },

        showError: function(data){

            console.log("Error >>");
            console.log(data);
        }
    };

    window.Login = Login;

})();