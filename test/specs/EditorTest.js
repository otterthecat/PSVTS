// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////


// modules to test
// /////////////////////////////////////////////////////////
var Editor = require('../../server/Editor');
var editor = new Editor();

describe('Editor', function(){

    it('should inherit relays propery', function(){

        editor.should.have.property('relays');
    });

    describe('#getMode()', function(){

        it('should retrieve file extension from a file name string', function(){

            editor.getMode('index.html').should.deep.equal('xml');
        });
    });
});