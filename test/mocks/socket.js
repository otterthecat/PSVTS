var MockSocket = function(){};

MockSocket.prototype = {
    on: function(name, cb){

        return {'name': name, 'callback': cb};
    },

    emit: function(name, ob){

        return ob;
    }
};

module.exports = MockSocket;