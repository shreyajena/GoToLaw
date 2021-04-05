var mongoose = require("mongoose");
//SCHEMA SETUP
var clientSchema = new mongoose.Schema({
	firstname: String,
	lastname: String,
	image:String,
	budget: Number,
	location:String,
	case_history:String,
	user : { type: mongoose.Schema.Types.ObjectID,
				ref: "User"
	}
});

var Client = new mongoose.model("Client",clientSchema);

module.exports= Client;