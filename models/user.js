var mongoose=require("mongoose");
var passportLocalMongoose = require ("passport-local-mongoose");
var friends = require("mongoose-friends");
// var friendsplugin= require("mongoose-friends-plugin");
// mongoose.Promise = global.Promise;

var UserSchema = mongoose.Schema({
	username : String,
	password: String,
});

UserSchema.plugin(friends({index: false}));

UserSchema.plugin(passportLocalMongoose);



module.exports= mongoose.model("User",UserSchema);