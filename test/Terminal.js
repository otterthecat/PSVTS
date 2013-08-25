// assertion library
var chai = require('chai').should();


// Mocks
// //////////////////////////////////////////////////////
var MockSocket = function(){};
MockSocket.prototype = {
    on: function(name, cb){

        return {'name': name, 'callback': cb};
    },

    emit: function(name, ob){

        return ob;
    }
};
var s = new MockSocket();


var mockChildProcess = function(){};
mockChildProcess.prototype = {

    'exec': function(str, callback){

       return callback('null', 'output success', '');
    }
};
var mcp = new mockChildProcess();


var cmd = 'ls ../';
var fail_cmd = 'git status';


// modules to test
// /////////////////////////////////////////////////////////
var Terminal = require('../server/Terminal');
var terminal = new Terminal(mcp, s);


describe('Terminal', function(){

    it('should assign internal socket property', function(){

        terminal.socket.should.be.an('object')
    });

    it('should assign internal childProcess property', function(){

        terminal.childProcess.should.be.an('object')
    });


    describe('#parse()', function(){

        it('should return an obect', function(){

            terminal.parse(cmd).should.include.keys('cmd', 'params');
        });
    });

    describe('#process()', function(){

        it('should return output if input command is allowed', function(){

            terminal.process(cmd).should.have.deep.property('out', 'output success');
        });

        it('should return error if input command is not allowed', function(){


            terminal.process(fail_cmd).should.have.deep.property('error', 'command not allowed');
        });
    });
});