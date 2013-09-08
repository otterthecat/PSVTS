var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nameRegEx = /[a-zA-Z0-9 ._-]+/;

var Preferences_Schema = new Schema({

    project:    {type: String, required: true}
    panels:     {type: Array, default: ['file', 'preview', 'terminal', 'menu']},
    fontSize:   {type: Number, default: 12},
    theme:      {type: String, default: 'snazzy'},
    autosave:   {type: Boolean, default: false}
});


var Preferences = mongoose.model('Preferences', Preferences_Schema);

module.exports = Preferences;