var mongoose = require("mongoose");
//SCHEMA SETUP
var url= "https://cdn4.vectorstock.com/i/1000x1000/50/23/advocate-icon-male-user-person-profile-avatar-vector-20905023.jpg"
var lawyerSchema = new mongoose.Schema({
	firstname: String,
	lastname: String,
	specialization: {type:String, default: "none"},
	image:{type:String, default: url},
	experience:{type:Number, default: 0},
	location:{type:String, default: "not revealed" },
	about:String,
	courts:String,
	languages:String,
	charge:Number,
	user : { type: mongoose.Schema.Types.ObjectID,
				ref: "User"
	}
});

var Lawyer = new mongoose.model("Lawyer",lawyerSchema);

module.exports= Lawyer;