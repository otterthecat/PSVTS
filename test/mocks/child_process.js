var mockChildProcess = function(){};

mockChildProcess.prototype = {

    'exec': function(str, callback){

       return callback('null', 'output success', '');
    }
};

module.exports = mockChildProcess;