var events = require('events');
var util = require('util');

// Relay Object
var Relay = function(){

    this.relays = [this];
    events.EventEmitter.call(this);
};

// Inherit from EventEmitter
util.inherits(Relay, events.EventEmitter);

// add new methods
Relay.prototype.addRelay = function(obj){

    this.relays.push(obj);
    return this;
};

Relay.prototype.runRelays = function(ev, data){

    var i =0;
    var ln = this.relays.length;

    for(i = 0; i < ln; i += 1){

        this.relays[i].emit(ev, data);
    };
};

// Add constructor to exports
module.exports = Relay;