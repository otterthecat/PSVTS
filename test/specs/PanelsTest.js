// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var Socket = require('../mocks/socket');
var mockSock = new Socket();


// modules to test
// /////////////////////////////////////////////////////////
var Panels = require('../../server/Panels');
var panels = new Panels();

describe('Panels', function(){

    describe("#loadPanels", function(){

        it('should load panels defined in panelList properties', function(){

            panels.loadPanels();
            panels.loadedPanels.should.haveOwnProperty('FilesPanel');
        });

        it('should return the panels instance', function(){

            panels.loadPanels().should.deep.equal(panels);
        });

    });

    describe("#getInstance", function(){

        it('should get the instance of the requested panel type', function(){

            panels.getInstance('PreviewPanel', {socket: mockSock}).should.be.instanceof(panels.loadedPanels.PreviewPanel);
        });
    });
});