var SocketServer = function(socket, params){

    this.socket = socket;
    this.utils = params.utils;
    this.dependencyList = params.dependencies || [];
    this.deps = {};
    this.listeners = params.listeners;
    this.emitters = params.emitters || {};

    this.setEvent = function(name, callback){
        var _this = this;
        _this.socket.on(name, function(data){

            callback.call(_this, data);
        });
    }

    return this;
};

SocketServer.prototype = {

    'loadDependencies': function(){

        var dl = this.dependencyList;
        for(var i = 0; i < dl.length; i += 1){

            this.deps[dl[i]] = require(dl[i]);
        }

        return this;
    },

    'listen': function(){

        var _this = this;
        var _listeners = this.listeners;

        // don't like this watcher here - find a better place for it
        _this.deps.fs.watch('projects/', function(){

            _this.socket.emit('update_files', {'updated': true});
        });

        for (var event in _listeners){

            _this.setEvent(event, _listeners[event]);
        }

        return _this;
    },

    'emit': function(event, data){

        this.socket.emit(event, data);
        return this;
    }
};

exports.SocketServer = SocketServer;