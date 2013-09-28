;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Editor = function(framework, socket){

    this.socket = socket;
    this.framework = framework;

    this.socket.on('edit_file', function(data){

        this.create('.codeMirror', data);
    }.bind(this));
};


Editor.prototype = {

    create: function(targetEl, params){

        var socket = this.socket;
        var targetElement = document.querySelector(targetEl);
        var content = params.content;
        var the_file = params.file;

        // until tabbed editing is created, just clear the old
        // and replace with new one
        targetElement.innerHTML = "";

        var cm = CodeMirror(targetElement, {
            theme: 'twilight',
            value: content,
            lineNumbers: true,
            extraKeys: { // this should really be extracted into an inserted object...
                'Ctrl-S': function(cm){

                    socket.emit('save_document',{
                        'path': the_file,
                        'content': cm.doc.getValue()
                    });
                }
            },
            mode: params.mode
        });

        cm.on('change', function(){
            console.log("File has been changed - perhaps 'auto' save to DB?");
        });
    }
};


module.exports = Editor;
},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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

            this.feedback.innerHTML = "";

            if(e.keyCode === 13){

                this.pushCmd(this.element.value);
            }
        }.bind(this));
    },

    onDataReturn: function(data){

        var output  = data.error ?  data.error : data.out;
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
},{}],4:[function(require,module,exports){
// Import
/////////////////////////////////////
var socket = require('./socket').socket;
var Editor = require('./Editor');
var Panels = require('./Panels').Panels;
var Terminal = require('./Terminal');

var editor = new Editor(CodeMirror, socket);


// Create interface panel modules
/////////////////////////////////////
Panels.setSocket(socket);
Panels.topPanel.setSocket(socket)
    .setPreviewToggle(document.querySelector('.appHeader [data-menu="preview"]'), document.querySelector('.main') );
Panels.filesPanel.setDisplay(document.querySelector('.fileList'), socket);
Panels.filesPanel.emit('load_files', 'projects');
Panels.filesPanel.listen('return_file_data', function(data){

    Panels.filesPanel.generateDisplay(data.files);
})
.listen('update_files', function(data){

    var iframe = document.querySelector('iframe');
    iframe.contentWindow.location.reload();
});


// Terminal
// /////////////////////////////////////
var terminal = new Terminal(socket, '#console');
},{"./Editor":1,"./Panels":2,"./Terminal":3,"./socket":5}],5:[function(require,module,exports){
// define the socket to make use of server/client events
///////////////////////////////////////////////////////
exports.socket = io.connect('http://localhost:4000');
},{}]},{},[4])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9zZXJ2by9zaXRlcy9naXRodWIvbm9kZWRpdG9yL2VkaXRvci9jbGllbnQvRWRpdG9yLmpzIiwiL2hvbWUvc2Vydm8vc2l0ZXMvZ2l0aHViL25vZGVkaXRvci9lZGl0b3IvY2xpZW50L1BhbmVscy5qcyIsIi9ob21lL3NlcnZvL3NpdGVzL2dpdGh1Yi9ub2RlZGl0b3IvZWRpdG9yL2NsaWVudC9UZXJtaW5hbC5qcyIsIi9ob21lL3NlcnZvL3NpdGVzL2dpdGh1Yi9ub2RlZGl0b3IvZWRpdG9yL2NsaWVudC9hcHAuanMiLCIvaG9tZS9zZXJ2by9zaXRlcy9naXRodWIvbm9kZWRpdG9yL2VkaXRvci9jbGllbnQvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgRWRpdG9yID0gZnVuY3Rpb24oZnJhbWV3b3JrLCBzb2NrZXQpe1xuXG4gICAgdGhpcy5zb2NrZXQgPSBzb2NrZXQ7XG4gICAgdGhpcy5mcmFtZXdvcmsgPSBmcmFtZXdvcms7XG5cbiAgICB0aGlzLnNvY2tldC5vbignZWRpdF9maWxlJywgZnVuY3Rpb24oZGF0YSl7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUoJy5jb2RlTWlycm9yJywgZGF0YSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cblxuRWRpdG9yLnByb3RvdHlwZSA9IHtcblxuICAgIGNyZWF0ZTogZnVuY3Rpb24odGFyZ2V0RWwsIHBhcmFtcyl7XG5cbiAgICAgICAgdmFyIHNvY2tldCA9IHRoaXMuc29ja2V0O1xuICAgICAgICB2YXIgdGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0RWwpO1xuICAgICAgICB2YXIgY29udGVudCA9IHBhcmFtcy5jb250ZW50O1xuICAgICAgICB2YXIgdGhlX2ZpbGUgPSBwYXJhbXMuZmlsZTtcblxuICAgICAgICAvLyB1bnRpbCB0YWJiZWQgZWRpdGluZyBpcyBjcmVhdGVkLCBqdXN0IGNsZWFyIHRoZSBvbGRcbiAgICAgICAgLy8gYW5kIHJlcGxhY2Ugd2l0aCBuZXcgb25lXG4gICAgICAgIHRhcmdldEVsZW1lbnQuaW5uZXJIVE1MID0gXCJcIjtcblxuICAgICAgICB2YXIgY20gPSBDb2RlTWlycm9yKHRhcmdldEVsZW1lbnQsIHtcbiAgICAgICAgICAgIHRoZW1lOiAndHdpbGlnaHQnLFxuICAgICAgICAgICAgdmFsdWU6IGNvbnRlbnQsXG4gICAgICAgICAgICBsaW5lTnVtYmVyczogdHJ1ZSxcbiAgICAgICAgICAgIGV4dHJhS2V5czogeyAvLyB0aGlzIHNob3VsZCByZWFsbHkgYmUgZXh0cmFjdGVkIGludG8gYW4gaW5zZXJ0ZWQgb2JqZWN0Li4uXG4gICAgICAgICAgICAgICAgJ0N0cmwtUyc6IGZ1bmN0aW9uKGNtKXtcblxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgnc2F2ZV9kb2N1bWVudCcse1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3BhdGgnOiB0aGVfZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb250ZW50JzogY20uZG9jLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vZGU6IHBhcmFtcy5tb2RlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNtLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGaWxlIGhhcyBiZWVuIGNoYW5nZWQgLSBwZXJoYXBzICdhdXRvJyBzYXZlIHRvIERCP1wiKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvcjsiLCIvKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBEZWZpbmUgYmFzaWMgcGFuZWwgb2JqZWN0c1xuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG4gICAgdmFyIFBhbmVscyA9IGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgdGhpcy5zb2NrZXQgPSBudWxsO1xuICAgIH07XG5cbiAgICB2YXIgVG9wUGFuZWwgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnByZXZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSBudWxsO1xuICAgIH07XG5cbiAgICB2YXIgRmlsZXNQYW5lbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSB7fTtcbiAgICB9O1xuXG4gICAgdmFyIENvbnNvbGVQYW5lbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuY29uc29sZSA9IHt9O1xuICAgIH07XG5cblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgU2V0IG1ldGhvZHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuICAgIFBhbmVscy5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgYWRkUGFuZWw6IGZ1bmN0aW9uKG5hbWUsIG9iail7XG5cbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSBvYmo7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmVQYW5lbDogZnVuY3Rpb24obmFtZSl7XG5cbiAgICAgICAgICAgIHRoaXNbbmFtZV0ucmVtb3ZlKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpc1tuYW1lXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldFNvY2tldDogZnVuY3Rpb24oc29ja2V0KXtcbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U29ja2V0OiBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb2NrZXQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgVG9wUGFuZWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIHNldFNvY2tldDogZnVuY3Rpb24oc29ja2V0KXtcblxuICAgICAgICAgICAgdGhpcy5zb2NrZXQgPSBzb2NrZXQ7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldFByZXZpZXdUb2dnbGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHRvZ2dsZVRhcmdldCl7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCl7XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudENsYXNzID0gdG9nZ2xlVGFyZ2V0LmNsYXNzTmFtZTtcblxuICAgICAgICAgICAgICAgIGlmKGN1cnJlbnRDbGFzcy5pbmRleE9mKCcgc2xpZGUgJykgIT09IC0xKXtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5pbm5lckhUTUwgPSBcIlByZXZpZXdcIjtcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlVGFyZ2V0LmNsYXNzTmFtZSA9IGN1cnJlbnRDbGFzcy5yZXBsYWNlKCcgc2xpZGUgJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gXCJFZGl0b3JcIjtcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlVGFyZ2V0LmNsYXNzTmFtZSArPSAnIHNsaWRlICc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcblxuICAgIEZpbGVzUGFuZWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGVtaXRTZWxlY3Rpb246IGZ1bmN0aW9uKHNlbGVjdGlvbil7XG5cbiAgICAgICAgICAgICBpZihzZWxlY3Rpb24uZ2V0QXR0cmlidXRlKCdkYXRhLWlzLWRpcmVjdG9yeScpID09PSAndHJ1ZScpIHtcblxuICAgICAgICAgICAgICAgIGlmKHNlbGVjdGlvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnKSA9PT0gJ2Nsb3NlZCcpIHtcblxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24uc2V0QXR0cmlidXRlKCdkYXRhLXN0YXRlJywgJ29wZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0RGlyZWN0b3J5UmVxdWVzdChzZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnNldEF0dHJpYnV0ZSgnZGF0YS1zdGF0ZScsICdjbG9zZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBzZWxlY3Rpb24ucXVlcnlTZWxlY3RvcigndWwnKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0gd291bGQgbGlrZSB0byByZW1vdmUgZnJvbSBtZW1vcnkgYXMgd2VsbFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQ2hpbGQoc3VibWVudSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRGaWxlUmVxdWVzdChzZWxlY3Rpb24pO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBlbWl0RmlsZVJlcXVlc3Q6IGZ1bmN0aW9uKHNlbGVjdGlvbil7XG5cbiAgICAgICAgICAgIHRoaXMuc29ja2V0LmVtaXQoJ2dldF9maWxlJywge1xuICAgICAgICAgICAgICAgICdmaWxlJzogc2VsZWN0aW9uLmdldEF0dHJpYnV0ZSgnZGF0YS1maWxlJylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVtaXREaXJlY3RvcnlSZXF1ZXN0OiBmdW5jdGlvbihzZWxlY3Rpb24pe1xuXG4gICAgICAgICAgICB0aGlzLnNvY2tldC5lbWl0KCdvcGVuX2RpcicsIHtcbiAgICAgICAgICAgICAgICAnZGlyZWN0b3J5Jzogc2VsZWN0aW9uLmdldEF0dHJpYnV0ZSgnZGF0YS1maWxlJylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldERpc3BsYXk6IGZ1bmN0aW9uKGVsZW1lbnQsIHNvY2tldCl7XG5cbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICAgICAgdGhpcy5maWxlcyA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdlbmVyYXRlRGlzcGxheTogZnVuY3Rpb24oZGF0YSl7XG5cbiAgICAgICAgICAgIHZhciB1bCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3VsLmZpbGVMaXN0Jyk7XG4gICAgICAgICAgICB2YXIgc29ja2V0ID0gdGhpcy5zb2NrZXQ7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uO1xuICAgICAgICAgICAgdWwub25jbGljayA9IGZ1bmN0aW9uKGV2ZW50KXtcblxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbiA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRTZWxlY3Rpb24oc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuXG4gICAgICAgICAgICAvLyAvLyBUT0RPIC0gbW92ZSB0aGlzIG91dCBvZiBoZXJlICAtIGl0IHdvcmtzLCBidXQgc2hvdWxkIGJlIGJldHRlciBhYnN0cmFjdGVkXG4gICAgICAgICAgICB0aGlzLnNvY2tldC5vbigncmV0dXJuX2Rpcl9jb250ZW50JywgZnVuY3Rpb24oZGF0YSl7XG5cbiAgICAgICAgICAgICAgICB2YXIgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5hcHBlbmRDaGlsZCh1bCk7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBrZXkgaW4gZGF0YS5maWxlcyl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgICAgICAgICAgICAgICAgICBsaS5zZXRBdHRyaWJ1dGUoJ2RhdGEtZmlsZScsIGtleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YS5maWxlc1trZXldLnR5cGUpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsaS5zZXRBdHRyaWJ1dGUoJ2RhdGEtaXMtZGlyZWN0b3J5JywgZGF0YS5maWxlc1trZXldLnR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGkuc2V0QXR0cmlidXRlKCdkYXRhLXN0YXRlJywgZGF0YS5maWxlc1trZXldLnN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBfdGV4dCA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICBsaS5pbm5lckhUTUwgPSBfdGV4dFtfdGV4dC5sZW5ndGgtMV07XG5cbiAgICAgICAgICAgICAgICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSl7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBkYXRhLnBhdGggfHwgJ3Byb2plY3RzJztcbiAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgICAgIGxpLnNldEF0dHJpYnV0ZSgnZGF0YS1maWxlJywga2V5KTtcblxuICAgICAgICAgICAgICAgIGlmKGRhdGFba2V5XS50eXBlKXtcblxuICAgICAgICAgICAgICAgICAgICBsaS5zZXRBdHRyaWJ1dGUoJ2RhdGEtaXMtZGlyZWN0b3J5JywgZGF0YVtrZXldLnR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBsaS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnLCBkYXRhW2tleV0uc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRPRE8gLSBleHRyYWN0IHRoaXMgdG8gb3duIG1ldGhvZFxuICAgICAgICAgICAgICAgIHZhciBfdGV4dCA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIGxpLmlubmVySFRNTCA9IF90ZXh0W190ZXh0Lmxlbmd0aC0xXTtcblxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2hvdWxkIHJlYWxseSBiZSBkb25lIGFmdGVyIHRoZSBsb29wXG4gICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgZnVsbCBsaXN0IG9mIGVsZW1lbnRzICh1c2Ugc3RyaW5nIGluc3RlYWQgb2Ygb2JqZWN0KVxuICAgICAgICAgICAgICAgIHVsLmFwcGVuZENoaWxkKGxpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsaXN0ZW46IGZ1bmN0aW9uKGV2ZW50LCBjYWxsYmFjayl7XG5cbiAgICAgICAgICAgIHRoaXMuc29ja2V0Lm9uKGV2ZW50LCBmdW5jdGlvbihkYXRhKXtcblxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZGF0YSl7XG5cbiAgICAgICAgICAgIHRoaXMuc29ja2V0LmVtaXQoZXZlbnROYW1lLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDb25zb2xlUGFuZWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIHNldENvbnNvbGU6IGZ1bmN0aW9uKGVsZW1lbnQpe1xuXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGUgPSBlbGVtZW50O1xuICAgICAgICB9XG4gICAgfTtcblxuXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEluc3RhbnRpYXRlIFBhbmVsc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cbiAgICB2YXIgcCA9IG5ldyBQYW5lbHMoKTtcbiAgICBwLmFkZFBhbmVsKCd0b3BQYW5lbCcsIG5ldyBUb3BQYW5lbCgpIClcbiAgICAgICAgLmFkZFBhbmVsKCdmaWxlc1BhbmVsJywgbmV3IEZpbGVzUGFuZWwoKSApXG4gICAgICAgIC5hZGRQYW5lbCgnY29uc29sZVBhbmVsJywgbmV3IENvbnNvbGVQYW5lbCgpICk7XG5cbmV4cG9ydHMuUGFuZWxzID0gcDsiLCJ2YXIgVGVybWluYWwgPSBmdW5jdGlvbihzb2NrZXQsIHNlbGVjdG9yKXtcblxuICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIHRoaXMuZmVlZGJhY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXBwRm9vdGVyIC50ZXJtaW5hbFJlc3BvbnNlJyk7XG4gICAgdGhpcy5oaXN0b3J5ID0gW107XG5cbiAgICB0aGlzLmluaXQoKTtcbn07XG5cblxuVGVybWluYWwucHJvdG90eXBlID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24oKXtcblxuICAgICAgICB0aGlzLmFwcGx5VHJpZ2dlckV2ZW50KCk7XG4gICAgICAgIHRoaXMuc29ja2V0Lm9uKCd0ZXJtaW5hbF9yZXR1cm4nLCB0aGlzLm9uRGF0YVJldHVybi5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgYXBwbHlUcmlnZ2VyRXZlbnQ6IGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKXtcblxuICAgICAgICAgICAgdGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSBcIlwiO1xuXG4gICAgICAgICAgICBpZihlLmtleUNvZGUgPT09IDEzKXtcblxuICAgICAgICAgICAgICAgIHRoaXMucHVzaENtZCh0aGlzLmVsZW1lbnQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBvbkRhdGFSZXR1cm46IGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgIHZhciBvdXRwdXQgID0gZGF0YS5lcnJvciA/ICBkYXRhLmVycm9yIDogZGF0YS5vdXQ7XG4gICAgICAgIHRoaXMuZmVlZGJhY2suaW5uZXJIVE1MID0gdGhpcy5jb252ZXJ0VGV4dChvdXRwdXQpO1xuICAgIH0sXG5cbiAgICBwdXNoQ21kOiBmdW5jdGlvbihjbWQpe1xuXG4gICAgICAgIHRoaXMuc29ja2V0LmVtaXQoJ3Rlcm1pbmFsX2NvbW1hbmQnLCBjbWQpO1xuICAgICAgICB0aGlzLmhpc3RvcnkucHVzaChjbWQpO1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSBcIlwiO1xuICAgIH0sXG5cbiAgICBnZXRIaXN0b3J5OiBmdW5jdGlvbihpbnQpe1xuXG4gICAgICAgIHJldHVybiB0aGlzLmhpc3RvcnlbaW50XTtcbiAgICB9LFxuXG4gICAgY29udmVydFRleHQ6IGZ1bmN0aW9uKHN0cil7XG5cbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXG4vZywgXCI8YnIvPlwiKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlcm1pbmFsOyIsIi8vIEltcG9ydFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xudmFyIHNvY2tldCA9IHJlcXVpcmUoJy4vc29ja2V0Jykuc29ja2V0O1xudmFyIEVkaXRvciA9IHJlcXVpcmUoJy4vRWRpdG9yJyk7XG52YXIgUGFuZWxzID0gcmVxdWlyZSgnLi9QYW5lbHMnKS5QYW5lbHM7XG52YXIgVGVybWluYWwgPSByZXF1aXJlKCcuL1Rlcm1pbmFsJyk7XG5cbnZhciBlZGl0b3IgPSBuZXcgRWRpdG9yKENvZGVNaXJyb3IsIHNvY2tldCk7XG5cblxuLy8gQ3JlYXRlIGludGVyZmFjZSBwYW5lbCBtb2R1bGVzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5QYW5lbHMuc2V0U29ja2V0KHNvY2tldCk7XG5QYW5lbHMudG9wUGFuZWwuc2V0U29ja2V0KHNvY2tldClcbiAgICAuc2V0UHJldmlld1RvZ2dsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXBwSGVhZGVyIFtkYXRhLW1lbnU9XCJwcmV2aWV3XCJdJyksIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tYWluJykgKTtcblBhbmVscy5maWxlc1BhbmVsLnNldERpc3BsYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbGVMaXN0JyksIHNvY2tldCk7XG5QYW5lbHMuZmlsZXNQYW5lbC5lbWl0KCdsb2FkX2ZpbGVzJywgJ3Byb2plY3RzJyk7XG5QYW5lbHMuZmlsZXNQYW5lbC5saXN0ZW4oJ3JldHVybl9maWxlX2RhdGEnLCBmdW5jdGlvbihkYXRhKXtcblxuICAgIFBhbmVscy5maWxlc1BhbmVsLmdlbmVyYXRlRGlzcGxheShkYXRhLmZpbGVzKTtcbn0pXG4ubGlzdGVuKCd1cGRhdGVfZmlsZXMnLCBmdW5jdGlvbihkYXRhKXtcblxuICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbn0pO1xuXG5cbi8vIFRlcm1pbmFsXG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG52YXIgdGVybWluYWwgPSBuZXcgVGVybWluYWwoc29ja2V0LCAnI2NvbnNvbGUnKTsiLCIvLyBkZWZpbmUgdGhlIHNvY2tldCB0byBtYWtlIHVzZSBvZiBzZXJ2ZXIvY2xpZW50IGV2ZW50c1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0cy5zb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vbG9jYWxob3N0OjQwMDAnKTsiXX0=
;