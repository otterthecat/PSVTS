(function(EditorFramework){


    var Editor = function(framework){

        this.framework = framework;
    };


    Editor.prototype = {

        create: function(targetEl, params){

            return new this.framework(params);
        }
    };


    window.Editor = new Editor(EditorFramework);
})(CodeMirror);