(function(EditorFramework){


    var Editor = function(framework){

        this.framework = framework;
    };


    Editor.prototype = {

        create: function(targetEl, params){

            var targetElement = document.querySelector(targetEl);
            var content = params.content;
            var the_file = params.file;

            var cm = CodeMirror(targetElement, {
                theme: 'twilight',
                value: content,
                lineNumbers: true,
                extraKeys: {
                    'Ctrl-S': function(cm){

                        // socket.emit('save_document',{
                        //     'path': 'files/' + the_file,
                        //     'content': cm.doc.getValue()
                        // })
                    }
                },
                mode: params.mode
            });

            cm.on('change', function(){
                console.log("File has been changed - perhaps 'auto' save to DB?");
            });
        }
    };


    window.Editor = new Editor(EditorFramework);
})(CodeMirror);