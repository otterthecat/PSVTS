var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nameRegEx = /[a-zA-Z0-9 ._-]+/;

var Project_Schema = new Schema({

    name:           {type: String, required: true, validate: nameRegEx},
    owner:          {type: String, required: true},
    collaborators:  {type: Array, default: []},
    createDate:     {type: Date, default: Date.now},
    lastUpdate:     {type: Date, default: Date.now}
});


var Project = mongoose.model('Project', Project_Schema);

module.exports = Project;