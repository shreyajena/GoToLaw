var express=require("express");
var app=express();

var bodyParser = require("body-parser");
var mongoose =require("mongoose");
var Type = require("./models/type");

var User = require("./models/user");
var Lawyer = require("./models/lawyer");
var Client = require("./models/client");

var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride =require("method-override");
var flash =require("connect-flash");


var multer = require('multer');
var path= require("path");
app.use(express.static(path.join(__dirname, "/public")))
 
var Storage = multer.diskStorage({
    destination:"./public/uploads/", filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
    }
});
 
var upload = multer({ 
	storage: Storage 
}).single('file');




 
//app functions
app.set("view engine","ejs");
//for session
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
	secret : "hello",
	resave: false,
	saveUninitialized: false		
}));

//for passport packages
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.static(__dirname + "/public"));
//TO OVVERIDE POST REQUEST WITH PUT WE USE THIS PACKAGE
app.use(methodOverride("_method"));
//We make a middleware that passes value of currentuser to all routes
app.use(function(req,res,next){
res.locals.currentuser=req.user;
	next();
});

//connect to mongoose+database
mongoose.connect("mongodb://localhost:27017/gotolaw_v1",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);


//ROUTES
app.get("/",(req,res)=>{
	res.render("index2",{message:req.flash("success")});
// 	var user1Id = mongoose.Types.ObjectId("5fca4c37b9b0de229a54ca5f");
// var user2Id = mongoose.Types.ObjectId("5fc782a28ad99a275c3dab7b");
// 	User.removeFriend( user1Id,user2Id, (err,remov)=>{
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 		console.log(remov);
// 		}
// 	});
	// User.getFriends("5fca73b8edc22646d42589d0",(err,friend)=>{
	// 	console.log(friend);
	// });

});
//Payment
app.get("/payment/:id",(req,res)=>{
	
	res.render("payment");
});

//SIGNUP NEW FORM
app.get("/signup",(req,res)=>{
		res.render("signup");	
});
//signup page-POST REQUEST
app.post("/signup",(req,res)=>{
	var u= req.body.user;
	User.register(new User({ username: req.body.username}),req.body.password,(err,user)=>{
		
		if(err){
			console.log(err);
			res.render("signup");
		}
		else{
			
			//starts session
			passport.authenticate("local")(req,res,()=>{
				
				//checking if lawyer or client
			if(u=='0')
		{ Lawyer.create(req.body.alluser,(err,lawyer)=>{
				if(err){
					console.log(err);
				}
		else{ console.log("lawyer added");
			lawyer.user=user;
				lawyer.save();
			 res.redirect("/");
		}
				});
			
		}
	else if(u=='1')
		{   Client.create(req.body.alluser,(err,client)=>{
				if(err){
					console.log(err);
				}
		else{ console.log("client added");
			client.user=user;
				client.save();
			 res.redirect("/");
		}
				});
							
		}
			});
				
		}
	});
	
});

//LOGIN FORM
app.get("/login",(req,res)=>{
		res.render("login",{message:req.flash("error")});
});

//LOGIN CHECK 
app.post("/login",passport.authenticate("local",{
	   successRedirect: "/",
	 failureRedirect: "/login",	
	failureFlash:true
}),(req,res)=>{
	console.log("loggedin");
});

//MY ACCOUNT SHOW FORM
app.get("/myaccount",isLoggedIn,(req,res)=>{
	var userid=req.user._id;
	var count=0;
	// User.getFriends(userid,(err,friends)=>{
	// 	count=friends.length;
	// 	console.log(count);
		
		Lawyer.findOne({ "user": userid }).populate("user").exec((err,foundLawyer)=>{
		if(err){
			console.log(err);
			res.redirect("/");	
		}
		//if not in lawyer
		else if(!foundLawyer){
		   //find in client
			Client.findOne({ "user": userid }).populate("user").exec((err,foundClient)=>{
		if(err){
			console.log(err);
			res.redirect("/");
		}
		else{
			User.getFriends(userid,(err,friends)=>{
		count=friends.length;
		console.log(count);
			
			//render client account
		res.render("account2",{myclient:foundClient,count:count});
			});
		}
								   
	});
		   }
		else{
			
			User.getPendingFriends(userid,(err,friends)=>{
		count=friends.length;
		console.log(count);
			//render lawyer account page
	      res.render("account",{lawyer:foundLawyer,count:count});
			
			});
		}
							
	 });
	
});

//MYACCOUNT UPDATE ROUTE
app.put("/myaccount",isLoggedIn,upload,(req,res)=>{
	var userid=req.user._id;
	// req.body.blog.body = req.sanitize(req.body.blog.body)
	if(req.body.lawyer){req.body.lawyer.image=req.file.filename;}
	else{
	req.body.myclient.image=req.file.filename;
	}
	Lawyer.findOneAndUpdate({ "user": userid },req.body.lawyer,(err,foundLawyer)=>{
		if(err){
			console.log(err);
			res.redirect("/");	
		}
		//if not in lawyer
		else if(!foundLawyer){
		   //find in client
			Client.findOneAndUpdate({ "user": userid },req.body.myclient,(err,foundClient)=>{
		if(err){
			console.log(err);
			res.redirect("/");
		}
		else{
			//render client account
		// res.render("account2",{myclient:foundClient});
			res.redirect("/");
		}
	});
		   }
		else{
			
			//render lawyer account page
	   
			res.redirect("/");
		}
	});
});


//LOGOUT
app.get("/logout",isLoggedIn,(req,res)=>{
	req.logout();
	req.flash("success","Logged you out!");
	res.redirect("/");
});

//ROUTES TO GET LAWYER PAGES
//ALL
app.get("/alllawyers",isLoggedIn,(req,res)=>{
	Type.find({name:"all"},(err,typefound)=>{
		 
		if(err){
			console.log(err);
		}
		else{
			
			
			Lawyer.find({},(err,alllawyers)=>{
		if(err){
			console.log("ERROR OCCURED!");
		}
		else{ 
			
			res.render("trialgrid", { lawyers :alllawyers, type:typefound });
		}
		});
		} 
	  });	
});

//MYACCOUNT DELETE
app.delete("/myaccount",isLoggedIn,(req,res)=>{
	 var userid=req.user._id;
	 req.logout();
	//find user
	 User.findByIdAndRemove(userid,(err,foundUser)=>{
		 if(err){
			 console.log(err);
		 }
		 else{
			 // find lawyer
			 Lawyer.findOneAndDelete({ "user": userid },(err,foundLawyer)=>{
		if(err){
			console.log(err);
		}
		//if not in lawyer
		else if(!foundLawyer){
		   //find in client
			Client.findOneAndDelete({ "user": userid },(err,foundClient)=>{
		if(err){
			console.log(err);
		}
		else{
			//delete client account
			console.log("client deleted");
		res.redirect("/");
		}
	});
		   }
		else{
			//delete lawyer account 
	      console.log("lawyer deleted");
		res.redirect("/");
		}
	});
			 
		 }
	 });
	
});
//SHOW MORE PAGE
app.get("/lawyer/show/:id",isLoggedIn,(req,res)=>{
	var s;
	var u;
	var userid=req.user._id;
	
	Lawyer.findById(req.params.id).populate("user").exec((err,foundlawyer)=>{
		if(err){
			console.log("ERROR OCCURED!");
		}
			
		else{ //check whether loggedin user is lawyer or client
	Lawyer.findOne({ "user": userid }).populate("user").exec((err,Lawyer)=>{
		if(err){
			console.log(err);
	
		}
		//if not lawyer
		else if(!Lawyer){
		   //find in client
			Client.findOne({ "user": userid }).populate("user").exec((err,foundClient)=>{
		if(err){
			console.log(err);
			
		}
		else{
			//SHOW PAGE WITH BUTTONS
			u=0;
		
			// check if requested
			User.getRequestedFriends(req.user._id,{username: foundlawyer.user.username},(err,requestedfriends)=>{
				
				//not in requested
				if(requestedfriends.length==0){
					
					User.getAcceptedFriends(req.user._id,{username: foundlawyer.user.username}, (err,acceptedfriends)=>{
						//not in accepted also 
					   if(acceptedfriends.length==0){
						   s="connected";
						   res.render("show", { lawyer :foundlawyer, status:s, user:u});
				   
					   }
							else{s="accepted";
								 res.render("show", { lawyer :foundlawyer, status:s, user:u});
								
								}
							
					});
					
				}
				else{
					s="requested";
					res.render("show", { lawyer :foundlawyer, status:s, user:u});	
						
				}	
			});	
		}
		
		
		});
			
					
		}
		else{
		//SHOW PAGE WITH NO BUTTON
			u=1;
	      res.render("show", { lawyer :foundlawyer, status:s, user:u});	
		}
	});
		   }
		
		
	});
		

	
	
	
});


// REQUEST CONNECTION ROUTE
app.post("/connect/:id",isLoggedIn,(req,res)=>{
	 var userid=req.user._id;
	
	Lawyer.findById(req.params.id,(err,foundlawyer)=>{
		if(err){
			console.log("ERROR OCCURED!");
		}
		else{ 
			User.requestFriend(userid,foundlawyer.user._id,(err,connection)=>{
		if(err){
			console.log(err);
		}
		else{ 
			
			res.redirect("/lawyer/show/"+req.params.id);
			
		}
	});
			
		}
		});	
});

//Notification
app.get("/notification",(req,res)=>{
	
	var reqclients=[];
	var reqlawyers=[];
	
	//FOR LAWYERS
	Lawyer.findOne({ "user": req.user._id }).populate("user").exec((err,foundLawyer)=>{
		if(err){
			console.log(err);
		}
		//if user is not lawyer, they are a client
		else if(!foundLawyer){
			//find lawyers they have requested
			User.getFriends(req.user._id,(err,allfriends)=>{
				if(err){
					console.log(err);	
				}
				else{
					if(allfriends.length>0){
					allfriends.forEach(function(f){
				
						
						User.findOne({"username": f.friend.username},(err,foundUser)=>{
		                  if(err){
			                      console.log(err);
		                        }
						else{
						Lawyer.findOne({ "user":foundUser._id },(err,foundLawyer)=>{
						if(err){
						console.log(err);
			
						}
						else{
							   reqlawyers.push(foundLawyer);
							if(reqlawyers.length==allfriends.length){
							res.render("notificationclient", {reqlawyers: reqlawyers, all:allfriends});
							}
						}
	
						});//lawyer find closed	 
						}//else closed
					});//UserfindOne	
				});//loop
					}
					else{
						res.render("notificationclient", {reqlawyers: reqlawyers});
					}
				}
			});	
			
		}
		else{//when user is a lawyer
	// find all pending request clients
			User.getPendingFriends(req.user._id,{},{username:1},(err,pendingfriends)=> {
				if(err){
					console.log(err);	
				}
				else{
					
					if(pendingfriends.length>0){
					pendingfriends.forEach(function(f){
				
						
						User.findOne({"username": f.friend.username},(err,foundUser)=>{
		                  if(err){
			                      console.log(err);
		                        }
						else{
						Client.findOne({ "user":foundUser._id },(err,foundClient)=>{
						if(err){
						console.log(err);
			
						}
						else{
							   reqclients.push(foundClient);
							if(reqclients.length==pendingfriends.length){
							res.render("notification", {reqclients: reqclients});
							}
						}
	
						});//client find closed	 
						}//else closed
					});//UserfindOne	
				});//loop
					}
					else{
						res.render("notification", {reqclients: reqclients});
					}
			 }		//else				   		   
			});//getpendingfriends
					
		}//else
			});//lawyerfindone
			//render client account	
	});//route
	
	
//MYCLIENT
app.get("/clientaccount/:id",isLoggedIn,(req,res)=>{
	
	Client.findById(req.params.id).populate("user").exec((err,foundClient)=>{
		if(err){
			console.log(err);

		}
		else{
			
			//render client account
		res.render("myclient",{myclient:foundClient});
		}
	});
	
});

//ACCEPT CONNECTION
app.post("/notification/:id",(req,res)=>{
	
		User.requestFriend(req.user._id,req.params.id,(err,acceptf)=>{
			if(err){
				console.log(err)
			}
			else{
			console.log("accepted");
		
		res.redirect("/notification");
		}
		});
	
	
});
//DELETE CONNECTION
app.delete("/notification/:id",(req,res)=>{
	
	var user1Id = mongoose.Types.ObjectId(req.user._id);
var user2Id = mongoose.Types.ObjectId(req.params.id);
	
		User.removeFriend(user1Id,user2Id,(err,declinef)=>{
			if(err){
				console.log(err)
			}
			else{
			console.log("deleted");
		
		res.redirect("/notification");
		}
		});
	
	
});


//FILTERED LAWYERS
app.get("/:lawyer",isLoggedIn,(req,res)=>{
	
	var type =req.params.lawyer;
	
	Type.find({name:type},(err,typefound)=>{
		 
		if(err){
			console.log(err);
		}
		else{
			Lawyer.find({specialization:type},(err,alllawyers)=>{
		if(err){
			console.log("ERROR OCCURED!");
		}
		else{ 
			res.render("trialgrid", { lawyers :alllawyers, type:typefound });
		}
		});
		}
			
		 
	  });
			
	});
		
		
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	
	req.flash("error","Please Login First");
	res.redirect("/login");
	
};

app.listen(3000,()=>{
	console.log("GoToLaw server has started");
});