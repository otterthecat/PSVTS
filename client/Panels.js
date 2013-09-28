/* *********************************
    Define basic panel objects
 ******************************** */
    var Panels = function(){

        this.socket = null;
    };

    var TopPanel = function(){
        this.preview = {};
        this.socket = null;
    };

    var FilesPanel = function(){
        this.files = {};
        this.socket = {};
    };

    var ConsolePanel = function(){
        this.console = {};
    };


/* *********************************
    Set methods
********************************* */
    Panels.prototype = {

        addPanel: function(name, obj){

            this[name] = obj;
            return this;
        },

        removePanel: function(name){

            this[name].remove();
            delete this[name];
            return this;
        },

        setSocket: function(socket){
            this.socket = socket;
            return this;
        },

        getSocket: function(){

            return this.socket;
        }
    };

    TopPanel.prototype = {

        setSocket: function(socket){

            this.socket = socket;

            return this;
        },

        setPreviewToggle: function(element, toggleTarget){

            this.element = element;
            this.element.addEventListener('click', function(event){

                var currentClass = toggleTarget.className;

                if(currentClass.indexOf(' slide ') !== -1){
                    event.currentTarget.innerHTML = "Preview";
                    toggleTarget.className = currentClass.replace(' slide ', '');
                } else {
                    event.currentTarget.innerHTML = "Editor";
                    toggleTarget.className += ' slide ';
                }
            });
        },
    };

    FilesPanel.prototype = {

        emitSelection: function(selection){
            console.log("--");
            console.log(selection);
             if(selection.getAttribute('data-is-directory') === 'true') {

                if(selection.getAttribute('data-state') === 'closed') {

                    selection.setAttribute('data-state', 'open');
                    this.emitDirectoryRequest(selection);
                } else {

                    selection.setAttribute('data-state', 'closed');
                    var submenu = selection.querySelector('ul');

                    // TODO - would like to remove from memory as well
                    selection.removeChild(submenu);
                }
             } else {
                console.log(selection);
                this.emitFileRequest(selection);
             }
        },

        emitFileRequest: function(selection){

            this.socket.emit('get_file', {
                'file': selection.getAttribute('data-file')
            });
        },

        emitDirectoryRequest: function(selection){

            this.socket.emit('open_dir', {
                'directory': selection.getAttribute('data-file')
            });
        },

        setDisplay: function(element, socket){

            this.socket = socket;
            this.files = element;

            return this;
        },

        generateDisplay: function(data){

            var ul = document.querySelector('ul.fileList');
            var socket = this.socket;
            var selection;
            ul.onclick = function(event){

                selection = event.target;
                this.emitSelection(selection);
            }.bind(this);


            // // TODO - move this out of here  - it works, but should be better abstracted
            this.socket.on('return_dir_content', function(data){

                var ul = document.createElement('ul');
                selection.appendChild(ul);
                for(var key in data.files){

                    var li = document.createElement('li');
                    console.log("key is ");
                    console.log(key);
                    li.setAttribute('data-file', key);

                    if(data.files[key].type){

                        li.setAttribute('data-is-directory', data.files[key].type);
                        li.setAttribute('data-state', data.files[key].state);
                    }

                    var _text = key.split('/');
                    li.innerHTML = _text[_text.length-1];

                    ul.appendChild(li);
                }
            });

            for (var key in data){
                var path = data.path || 'projects';
                var li = document.createElement('li');
                li.setAttribute('data-file', key);

                if(data[key].type){

                    li.setAttribute('data-is-directory', data[key].type);
                    li.setAttribute('data-state', data[key].state);
                }

                // TODO - extract this to own method
                var _text = key.split('/');
                li.innerHTML = _text[_text.length-1];

                // this should really be done after the loop
                // with the full list of elements (use string instead of object)
                ul.appendChild(li);
            }
        },

        listen: function(event, callback){

            this.socket.on(event, function(data){

                callback(data);
            });

            return this;
        },

        emit: function(eventName, data){

            this.socket.emit(eventName, data);
        }
    };

    ConsolePanel.prototype = {

        setConsole: function(element){

            this.console = element;
        }
    };


/* ***********************************
    Instantiate Panels
*********************************** */
    var p = new Panels();
    p.addPanel('topPanel', new TopPanel() )
        .addPanel('filesPanel', new FilesPanel() )
        .addPanel('consolePanel', new ConsolePanel() );

exports.Panels = p;