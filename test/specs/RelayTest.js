// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
// no mocks needed yet


// modules to test
// /////////////////////////////////////////////////////////
var Relay = require('../../server/Relay');
var relay = new Relay();

describe('Relay', function(){

    it('should define .relays property as array', function(){

        relay.relays.should.be.an.instanceof(Array);
    });

    it('should have first element of .relays property as the relay instance', function(){

        relay.relays[0].should.deep.equal(relay);
    });

    describe('#addRelay()', function(){

        it('should add passed object to the .relays property', function(){

            var o = {};

            relay.addRelay(o);
            relay.relays[1].should.deep.equal(o);
        });

        it('should return the relay instance', function(){

            relay.addRelay({}).should.deep.equal(relay);
        });
    });

    describe("#runRelays()", function(){

        it('should trigger event for each element of .relays array', function(done){

            var counter = 0;
            var r = new Relay();
            r.addRelay(r);
            r.on('test', function(data){

                counter += data;
                if(counter === r.relays.length){
                    done();
                }
            });

            r.runRelays('test', 1);
        });
    });
});