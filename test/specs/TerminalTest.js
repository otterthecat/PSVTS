// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var Socket = require('../mocks/socket');
var Child_Process = require('../mocks/child_process');
var cmds = require('../mocks/cmds');


// modules to test
// /////////////////////////////////////////////////////////
var Terminal = require('../../server/Terminal');
var terminal = new Terminal(new Child_Process(), new Socket());


describe('Terminal', function(){

    it('should assign internal socket property', function(){

        terminal.socket.should.be.an('object');
    });

    it('should assign internal childProcess property', function(){

        terminal.childProcess.should.be.an('object');
    });


    describe('#parse()', function(){

        it('should return an obect', function(){

            terminal.parse(cmds.cmd).should.include.keys('cmd', 'params');
        });
    });

    describe('#process()', function(){

        it('should return output if input command is allowed', function(){

            terminal.process(cmds.cmd).should.have.deep.property('out', 'output success');
        });

        it('should return error if input command is not allowed', function(){


            terminal.process(cmds.fail_cmd).should.have.deep.property('error', 'command not allowed');
        });
    });
});