var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/test");

var nameRegEx = /[a-zA-Z -]+/;
var emailRegEx = /[a-zA-Z0-9_+-]+@[a-zA-Z0-9-]+.[a-zA-Z]{2,4}/;

var User_Schema = new Schema({

    name:       {type: String, required: true, index: {unique: true}, validate: nameRegEx},
    email:      {type: String, required: true, index: {unique: true}, validate: emailRegEx},
    password:   {type: String, required: true},
    createDate: {type: Date, default: Date.now},
    lastLogin:  {type: Date, default: Date.now},
    isLoggedIn: {type: Boolean, default: false},
    projects:   {type: Array, default: []}
});


User_Schema.virtual('gravatarLink').get(function(){

    var hash = crypto.createHash('md5').update(this.email).digest('hex');
    return "https://2.gravatar.com/avatar/" + hash + "&d=mm";
});


User_Schema.virtual('projectLinks').get(function(){

    var linkArray = [];

    for(var i = 0; i < this.projects.length; i += 1){

        linkArray.push("http://link-to-project/" + this.projects[i]);
    }

    return linkArray;
});

var User = mongoose.model('User', User_Schema);

module.exports = User;