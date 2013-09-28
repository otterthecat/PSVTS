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

                    li.setAttribute('data-file', data.path + '/' + key);

                    if(data.files[key].type){

                        li.setAttribute('data-is-directory', data.files[key].type);
                        li.setAttribute('data-state', data.files[key].state);
                    }

                    li.innerHTML = key;

                    ul.appendChild(li);
                }
            });

            for (var key in data){
                var path = data.path || 'projects';
                var li = document.createElement('li');
                li.setAttribute('data-file', path + '/' + key);

                if(data[key].type){

                    li.setAttribute('data-is-directory', data[key].type);
                    li.setAttribute('data-state', data[key].state);
                }
                li.innerHTML = key;

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9zZXJ2by9zaXRlcy9naXRodWIvbm9kZWRpdG9yL2VkaXRvci9jbGllbnQvRWRpdG9yLmpzIiwiL2hvbWUvc2Vydm8vc2l0ZXMvZ2l0aHViL25vZGVkaXRvci9lZGl0b3IvY2xpZW50L1BhbmVscy5qcyIsIi9ob21lL3NlcnZvL3NpdGVzL2dpdGh1Yi9ub2RlZGl0b3IvZWRpdG9yL2NsaWVudC9UZXJtaW5hbC5qcyIsIi9ob21lL3NlcnZvL3NpdGVzL2dpdGh1Yi9ub2RlZGl0b3IvZWRpdG9yL2NsaWVudC9hcHAuanMiLCIvaG9tZS9zZXJ2by9zaXRlcy9naXRodWIvbm9kZWRpdG9yL2VkaXRvci9jbGllbnQvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEVkaXRvciA9IGZ1bmN0aW9uKGZyYW1ld29yaywgc29ja2V0KXtcblxuICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgIHRoaXMuZnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2VkaXRfZmlsZScsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgIHRoaXMuY3JlYXRlKCcuY29kZU1pcnJvcicsIGRhdGEpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5cbkVkaXRvci5wcm90b3R5cGUgPSB7XG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKHRhcmdldEVsLCBwYXJhbXMpe1xuXG4gICAgICAgIHZhciBzb2NrZXQgPSB0aGlzLnNvY2tldDtcbiAgICAgICAgdmFyIHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldEVsKTtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBwYXJhbXMuY29udGVudDtcbiAgICAgICAgdmFyIHRoZV9maWxlID0gcGFyYW1zLmZpbGU7XG5cbiAgICAgICAgLy8gdW50aWwgdGFiYmVkIGVkaXRpbmcgaXMgY3JlYXRlZCwganVzdCBjbGVhciB0aGUgb2xkXG4gICAgICAgIC8vIGFuZCByZXBsYWNlIHdpdGggbmV3IG9uZVxuICAgICAgICB0YXJnZXRFbGVtZW50LmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICAgICAgdmFyIGNtID0gQ29kZU1pcnJvcih0YXJnZXRFbGVtZW50LCB7XG4gICAgICAgICAgICB0aGVtZTogJ3R3aWxpZ2h0JyxcbiAgICAgICAgICAgIHZhbHVlOiBjb250ZW50LFxuICAgICAgICAgICAgbGluZU51bWJlcnM6IHRydWUsXG4gICAgICAgICAgICBleHRyYUtleXM6IHsgLy8gdGhpcyBzaG91bGQgcmVhbGx5IGJlIGV4dHJhY3RlZCBpbnRvIGFuIGluc2VydGVkIG9iamVjdC4uLlxuICAgICAgICAgICAgICAgICdDdHJsLVMnOiBmdW5jdGlvbihjbSl7XG5cbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ3NhdmVfZG9jdW1lbnQnLHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdwYXRoJzogdGhlX2ZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IGNtLmRvYy5nZXRWYWx1ZSgpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb2RlOiBwYXJhbXMubW9kZVxuICAgICAgICB9KTtcblxuICAgICAgICBjbS5vbignY2hhbmdlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRmlsZSBoYXMgYmVlbiBjaGFuZ2VkIC0gcGVyaGFwcyAnYXV0bycgc2F2ZSB0byBEQj9cIik7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7IiwiLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgRGVmaW5lIGJhc2ljIHBhbmVsIG9iamVjdHNcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuICAgIHZhciBQYW5lbHMgPSBmdW5jdGlvbigpe1xuXG4gICAgICAgIHRoaXMuc29ja2V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgdmFyIFRvcFBhbmVsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5wcmV2aWV3ID0ge307XG4gICAgICAgIHRoaXMuc29ja2V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgdmFyIEZpbGVzUGFuZWwgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIHRoaXMuc29ja2V0ID0ge307XG4gICAgfTtcblxuICAgIHZhciBDb25zb2xlUGFuZWwgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmNvbnNvbGUgPSB7fTtcbiAgICB9O1xuXG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIFNldCBtZXRob2RzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cbiAgICBQYW5lbHMucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGFkZFBhbmVsOiBmdW5jdGlvbihuYW1lLCBvYmope1xuXG4gICAgICAgICAgICB0aGlzW25hbWVdID0gb2JqO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlUGFuZWw6IGZ1bmN0aW9uKG5hbWUpe1xuXG4gICAgICAgICAgICB0aGlzW25hbWVdLnJlbW92ZSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXNbbmFtZV07XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRTb2NrZXQ6IGZ1bmN0aW9uKHNvY2tldCl7XG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IHNvY2tldDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNvY2tldDogZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29ja2V0O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIFRvcFBhbmVsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBzZXRTb2NrZXQ6IGZ1bmN0aW9uKHNvY2tldCl7XG5cbiAgICAgICAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRQcmV2aWV3VG9nZ2xlOiBmdW5jdGlvbihlbGVtZW50LCB0b2dnbGVUYXJnZXQpe1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpe1xuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRDbGFzcyA9IHRvZ2dsZVRhcmdldC5jbGFzc05hbWU7XG5cbiAgICAgICAgICAgICAgICBpZihjdXJyZW50Q2xhc3MuaW5kZXhPZignIHNsaWRlICcpICE9PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gXCJQcmV2aWV3XCI7XG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZVRhcmdldC5jbGFzc05hbWUgPSBjdXJyZW50Q2xhc3MucmVwbGFjZSgnIHNsaWRlICcsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmlubmVySFRNTCA9IFwiRWRpdG9yXCI7XG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZVRhcmdldC5jbGFzc05hbWUgKz0gJyBzbGlkZSAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBGaWxlc1BhbmVsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBlbWl0U2VsZWN0aW9uOiBmdW5jdGlvbihzZWxlY3Rpb24pe1xuXG4gICAgICAgICAgICAgaWYoc2VsZWN0aW9uLmdldEF0dHJpYnV0ZSgnZGF0YS1pcy1kaXJlY3RvcnknKSA9PT0gJ3RydWUnKSB7XG5cbiAgICAgICAgICAgICAgICBpZihzZWxlY3Rpb24uZ2V0QXR0cmlidXRlKCdkYXRhLXN0YXRlJykgPT09ICdjbG9zZWQnKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnNldEF0dHJpYnV0ZSgnZGF0YS1zdGF0ZScsICdvcGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdERpcmVjdG9yeVJlcXVlc3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3RhdGUnLCAnY2xvc2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWJtZW51ID0gc2VsZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAtIHdvdWxkIGxpa2UgdG8gcmVtb3ZlIGZyb20gbWVtb3J5IGFzIHdlbGxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnJlbW92ZUNoaWxkKHN1Ym1lbnUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0RmlsZVJlcXVlc3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW1pdEZpbGVSZXF1ZXN0OiBmdW5jdGlvbihzZWxlY3Rpb24pe1xuXG4gICAgICAgICAgICB0aGlzLnNvY2tldC5lbWl0KCdnZXRfZmlsZScsIHtcbiAgICAgICAgICAgICAgICAnZmlsZSc6IHNlbGVjdGlvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmlsZScpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBlbWl0RGlyZWN0b3J5UmVxdWVzdDogZnVuY3Rpb24oc2VsZWN0aW9uKXtcblxuICAgICAgICAgICAgdGhpcy5zb2NrZXQuZW1pdCgnb3Blbl9kaXInLCB7XG4gICAgICAgICAgICAgICAgJ2RpcmVjdG9yeSc6IHNlbGVjdGlvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmlsZScpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXREaXNwbGF5OiBmdW5jdGlvbihlbGVtZW50LCBzb2NrZXQpe1xuXG4gICAgICAgICAgICB0aGlzLnNvY2tldCA9IHNvY2tldDtcbiAgICAgICAgICAgIHRoaXMuZmlsZXMgPSBlbGVtZW50O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZW5lcmF0ZURpc3BsYXk6IGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICB2YXIgdWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd1bC5maWxlTGlzdCcpO1xuICAgICAgICAgICAgdmFyIHNvY2tldCA9IHRoaXMuc29ja2V0O1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbjtcbiAgICAgICAgICAgIHVsLm9uY2xpY2sgPSBmdW5jdGlvbihldmVudCl7XG5cbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24gPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0U2VsZWN0aW9uKHNlbGVjdGlvbik7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cblxuICAgICAgICAgICAgLy8gLy8gVE9ETyAtIG1vdmUgdGhpcyBvdXQgb2YgaGVyZSAgLSBpdCB3b3JrcywgYnV0IHNob3VsZCBiZSBiZXR0ZXIgYWJzdHJhY3RlZFxuICAgICAgICAgICAgdGhpcy5zb2NrZXQub24oJ3JldHVybl9kaXJfY29udGVudCcsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICAgICAgdmFyIHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24uYXBwZW5kQ2hpbGQodWwpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIga2V5IGluIGRhdGEuZmlsZXMpe1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGkuc2V0QXR0cmlidXRlKCdkYXRhLWZpbGUnLCBkYXRhLnBhdGggKyAnLycgKyBrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKGRhdGEuZmlsZXNba2V5XS50eXBlKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGkuc2V0QXR0cmlidXRlKCdkYXRhLWlzLWRpcmVjdG9yeScsIGRhdGEuZmlsZXNba2V5XS50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLnNldEF0dHJpYnV0ZSgnZGF0YS1zdGF0ZScsIGRhdGEuZmlsZXNba2V5XS5zdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsaS5pbm5lckhUTUwgPSBrZXk7XG5cbiAgICAgICAgICAgICAgICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSl7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBkYXRhLnBhdGggfHwgJ3Byb2plY3RzJztcbiAgICAgICAgICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgICAgIGxpLnNldEF0dHJpYnV0ZSgnZGF0YS1maWxlJywgcGF0aCArICcvJyArIGtleSk7XG5cbiAgICAgICAgICAgICAgICBpZihkYXRhW2tleV0udHlwZSl7XG5cbiAgICAgICAgICAgICAgICAgICAgbGkuc2V0QXR0cmlidXRlKCdkYXRhLWlzLWRpcmVjdG9yeScsIGRhdGFba2V5XS50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgbGkuc2V0QXR0cmlidXRlKCdkYXRhLXN0YXRlJywgZGF0YVtrZXldLnN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGkuaW5uZXJIVE1MID0ga2V5O1xuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzaG91bGQgcmVhbGx5IGJlIGRvbmUgYWZ0ZXIgdGhlIGxvb3BcbiAgICAgICAgICAgICAgICAvLyB3aXRoIHRoZSBmdWxsIGxpc3Qgb2YgZWxlbWVudHMgKHVzZSBzdHJpbmcgaW5zdGVhZCBvZiBvYmplY3QpXG4gICAgICAgICAgICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGxpc3RlbjogZnVuY3Rpb24oZXZlbnQsIGNhbGxiYWNrKXtcblxuICAgICAgICAgICAgdGhpcy5zb2NrZXQub24oZXZlbnQsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW1pdDogZnVuY3Rpb24oZXZlbnROYW1lLCBkYXRhKXtcblxuICAgICAgICAgICAgdGhpcy5zb2NrZXQuZW1pdChldmVudE5hbWUsIGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENvbnNvbGVQYW5lbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgc2V0Q29uc29sZTogZnVuY3Rpb24oZWxlbWVudCl7XG5cbiAgICAgICAgICAgIHRoaXMuY29uc29sZSA9IGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgSW5zdGFudGlhdGUgUGFuZWxzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuICAgIHZhciBwID0gbmV3IFBhbmVscygpO1xuICAgIHAuYWRkUGFuZWwoJ3RvcFBhbmVsJywgbmV3IFRvcFBhbmVsKCkgKVxuICAgICAgICAuYWRkUGFuZWwoJ2ZpbGVzUGFuZWwnLCBuZXcgRmlsZXNQYW5lbCgpIClcbiAgICAgICAgLmFkZFBhbmVsKCdjb25zb2xlUGFuZWwnLCBuZXcgQ29uc29sZVBhbmVsKCkgKTtcblxuZXhwb3J0cy5QYW5lbHMgPSBwOyIsInZhciBUZXJtaW5hbCA9IGZ1bmN0aW9uKHNvY2tldCwgc2VsZWN0b3Ipe1xuXG4gICAgdGhpcy5zb2NrZXQgPSBzb2NrZXQ7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgdGhpcy5mZWVkYmFjayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcHBGb290ZXIgLnRlcm1pbmFsUmVzcG9uc2UnKTtcbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuICAgIHRoaXMuaW5pdCgpO1xufTtcblxuXG5UZXJtaW5hbC5wcm90b3R5cGUgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbigpe1xuXG4gICAgICAgIHRoaXMuYXBwbHlUcmlnZ2VyRXZlbnQoKTtcbiAgICAgICAgdGhpcy5zb2NrZXQub24oJ3Rlcm1pbmFsX3JldHVybicsIHRoaXMub25EYXRhUmV0dXJuLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBhcHBseVRyaWdnZXJFdmVudDogZnVuY3Rpb24oKXtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgICAgICB0aGlzLmZlZWRiYWNrLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICAgICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTMpe1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoQ21kKHRoaXMuZWxlbWVudC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uRGF0YVJldHVybjogZnVuY3Rpb24oZGF0YSl7XG5cbiAgICAgICAgdmFyIG91dHB1dCAgPSBkYXRhLmVycm9yID8gIGRhdGEuZXJyb3IgOiBkYXRhLm91dDtcbiAgICAgICAgdGhpcy5mZWVkYmFjay5pbm5lckhUTUwgPSB0aGlzLmNvbnZlcnRUZXh0KG91dHB1dCk7XG4gICAgfSxcblxuICAgIHB1c2hDbWQ6IGZ1bmN0aW9uKGNtZCl7XG5cbiAgICAgICAgdGhpcy5zb2NrZXQuZW1pdCgndGVybWluYWxfY29tbWFuZCcsIGNtZCk7XG4gICAgICAgIHRoaXMuaGlzdG9yeS5wdXNoKGNtZCk7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IFwiXCI7XG4gICAgfSxcblxuICAgIGdldEhpc3Rvcnk6IGZ1bmN0aW9uKGludCl7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeVtpbnRdO1xuICAgIH0sXG5cbiAgICBjb252ZXJ0VGV4dDogZnVuY3Rpb24oc3RyKXtcblxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcbi9nLCBcIjxici8+XCIpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGVybWluYWw7IiwiLy8gSW1wb3J0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG52YXIgc29ja2V0ID0gcmVxdWlyZSgnLi9zb2NrZXQnKS5zb2NrZXQ7XG52YXIgRWRpdG9yID0gcmVxdWlyZSgnLi9FZGl0b3InKTtcbnZhciBQYW5lbHMgPSByZXF1aXJlKCcuL1BhbmVscycpLlBhbmVscztcbnZhciBUZXJtaW5hbCA9IHJlcXVpcmUoJy4vVGVybWluYWwnKTtcblxudmFyIGVkaXRvciA9IG5ldyBFZGl0b3IoQ29kZU1pcnJvciwgc29ja2V0KTtcblxuXG4vLyBDcmVhdGUgaW50ZXJmYWNlIHBhbmVsIG1vZHVsZXNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblBhbmVscy5zZXRTb2NrZXQoc29ja2V0KTtcblBhbmVscy50b3BQYW5lbC5zZXRTb2NrZXQoc29ja2V0KVxuICAgIC5zZXRQcmV2aWV3VG9nZ2xlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcHBIZWFkZXIgW2RhdGEtbWVudT1cInByZXZpZXdcIl0nKSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1haW4nKSApO1xuUGFuZWxzLmZpbGVzUGFuZWwuc2V0RGlzcGxheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsZUxpc3QnKSwgc29ja2V0KTtcblBhbmVscy5maWxlc1BhbmVsLmVtaXQoJ2xvYWRfZmlsZXMnLCAncHJvamVjdHMnKTtcblBhbmVscy5maWxlc1BhbmVsLmxpc3RlbigncmV0dXJuX2ZpbGVfZGF0YScsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgUGFuZWxzLmZpbGVzUGFuZWwuZ2VuZXJhdGVEaXNwbGF5KGRhdGEuZmlsZXMpO1xufSlcbi5saXN0ZW4oJ3VwZGF0ZV9maWxlcycsIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgdmFyIGlmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xufSk7XG5cblxuLy8gVGVybWluYWxcbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbnZhciB0ZXJtaW5hbCA9IG5ldyBUZXJtaW5hbChzb2NrZXQsICcjY29uc29sZScpOyIsIi8vIGRlZmluZSB0aGUgc29ja2V0IHRvIG1ha2UgdXNlIG9mIHNlcnZlci9jbGllbnQgZXZlbnRzXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnRzLnNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcpOyJdfQ==
;