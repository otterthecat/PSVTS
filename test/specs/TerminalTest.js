// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var Child_Process = require('../mocks/child_process');
var cmds = require('../mocks/cmds');


// modules to test
// /////////////////////////////////////////////////////////
var Terminal = require('../../server/Terminal');
var terminal = new Terminal(new Child_Process());


describe('Terminal', function(){

    it('should assign internal childProcess property', function(){

        terminal.childProcess.should.be.an('object');
    });


    describe('#parse()', function(){

        it('should return an obect', function(){

            terminal.parse(cmds.cmd).should.include.keys('cmd', 'params');
        });
    });

    describe('#process()', function(){

        it('should return return itself', function(){

            terminal.process(cmds.cmd).should.deep.equal(terminal);
        });
    });
});