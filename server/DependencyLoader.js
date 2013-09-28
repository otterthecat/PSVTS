var DepLoader = function(list){

    this.dependencyList = list || [];
    this.deps = {};
};

DepLoader.prototype = {

    'loadDependencies': function(){

        var dl = this.dependencyList;
        for(var i = 0; i < dl.length; i += 1){

            this.deps[dl[i]] = require(dl[i]);
        }

        return this;
    },

    get: function(name){

        if(name === '*') {

            return this.deps;
        }

        return this.deps[name] || null;
    }
};

module.exports = DepLoader;