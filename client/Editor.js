(function(EditorFramework, SocketObject){


    var Editor = function(framework, socket){

        this.socket = socket;
        this.framework = framework;
    };


    Editor.prototype = {

        create: function(targetEl, params){

            var socket = this.socket;
            var targetElement = document.querySelector(targetEl);
            var content = params.content;
            var the_file = params.file;

            var cm = CodeMirror(targetElement, {
                theme: 'twilight',
                value: content,
                lineNumbers: true,
                extraKeys: { // this should really be extracted into an inserted object...
                    'Ctrl-S': function(cm){

                        socket.emit('save_document',{
                            'path': 'projects/' + the_file,
                            'content': cm.doc.getValue()
                        })
                    }
                },
                mode: params.mode
            });

            cm.on('change', function(){
                console.log("File has been changed - perhaps 'auto' save to DB?");
            });
        }
    };


    window.Editor = new Editor(EditorFramework, SocketObject);
})(CodeMirror, socket);