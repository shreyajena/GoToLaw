var mongoose = require("mongoose");
//SCHEMA SETUP
var typeSchema = new mongoose.Schema({
	name: String,
	image: String,
	desc: String
});

var Type = new mongoose.model("Type",typeSchema);

module.exports= Type;