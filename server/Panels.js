var Panels = function(){

    this.panelPath = './panels/';
    this.panelList = ['FilesPanel', 'PreviewPanel'];
    this.loadedPanels = {};
};

Panels.prototype = {

    loadPanels: function(){

        for(var i = 0; i < this.panelList.length; i += 1){

            var name = this.panelList[i];
            this.loadedPanels[name] = require(this.panelPath + name);
        }

        return this;
    },

    getInstance: function(name, args){

        return new this.loadedPanels[name](args);
    }
};

module.exports = Panels;