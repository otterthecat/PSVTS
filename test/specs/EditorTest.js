// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var Socket = require('../mocks/socket');
var mock = new Socket();

var Path = require('../mocks/path');
var path = new Path();


// modules to test
// /////////////////////////////////////////////////////////
var Editor = require('../../server/Editor');
var editor = new Editor(mock, path);

describe('Editor', function(){

    it('should inherit relays propery', function(){

        editor.should.have.property('relays');
    });

    it('should set internal fs from passeed fs object', function(){

        editor.fs.should.deep.equal(mock);
    });

    it('should set internal path from passed path object', function(){

        editor.path.should.deep.equal(path);
    });

    describe('#getMode()', function(){

        it('should retrieve file extension from a file name string', function(){

            editor.getMode('index.html').should.deep.equal('xml');
        });
    });
});