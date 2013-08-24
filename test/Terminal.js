// assertion library
var should = require('chai').should();

// mocks
var MockSocket = function(){};
MockSocket.prototype = {
    on: function(name, cb){

        return {'name': name, 'callback': cb};
    },

    emit: function(name, ob){

        return {'out': null, 'error': 'command not allowed'};
    }
};
var s = new MockSocket();

var MockChildProcess = function(){};
MockChildProcess.prototype = {

};

var cmd = "ls ../../";

var fail_cmd = 'git status';


// modules to tes
var Terminal = require('../server/Terminal');
var terminal = new Terminal({}, s);


describe('terminal', function(){

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

        it('should return error if command is not allowed', function(){

            terminal.process(fail_cmd).should.have.deep.property('error', 'command not allowed');
        });
    });
});