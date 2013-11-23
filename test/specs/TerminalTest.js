// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var cmds = require('../mocks/cmds');


// modules to test
// /////////////////////////////////////////////////////////
var Terminal = require('../../server/Terminal');
var terminal = new Terminal();


describe('Terminal', function(){


    describe('#parse()', function(){

        it('should return an obect', function(){

            terminal.parse(cmds.cmd).should.include.keys('cmd', 'params');
        });
    });

    describe('#process()', function(){

        it('should return false if command passed is invalid', function(){

            terminal.process('notvalid').should.deep.equal(false);
        });
    });
});