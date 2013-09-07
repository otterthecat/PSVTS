var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nameRegEx = /[a-zA-Z -]+/;
var emailRegEx = /[a-zA-Z0-9_+-]+@[].[]{2,4}/;

var User_Schema = new Schema({

    name: {type: String, required: true, validate: nameRegEx},
    email: {type: String, required: true, index: {unique: true}, validate: emailRegEx},
    password: {type: String, required: true},
    gravatarHash: {type: String},
    createDate: {type: Date, default: Date.now},
    lastLogin: {type: Date, default: Date.now},
    isLoggedIn: {type: Boolean, default: false},
    projects: {type: Array, default: []}
});


User_Schema.virtual('gravatarLink').get(function(){

    return "https://gravatar.com/" + this.gravatarHash;
});

User_Schema.virtual('projectLinks').get(function(){

    var i,
        linkArray = [];

    for(var i = 0; i < this.projects.length, i += 1){

        linkArray.push("http://link-to-project/" + this.projects[i]);
    }

    return linkArray;
});


module.exports = User_Schema;