var express = require('express');
var path = require('path');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var md5 = require('md5');
var helpers = require('handlebars-helpers')();
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var fileUpload = require('express-fileupload');
var multer  = require('multer')
var User = require('../models/user');
var Company = require('../models/company');
/*-----------------------------------------Common------------------------------------------------*/

//Check authentication
function ensureAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else
	{
		req.flash('error_msg','You are not logged in');
		res.redirect('/');
	}
}

//Register user
router.post('/register',function(req,res){
	var name = req.body.name;
	var rollno = req.body.rollno;
	var email = req.body.email;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;
	rollno = rollno.toUpperCase();
	//var user_level = req.body.user_level;

	//Validation
	req.checkBody('name','Name is required').notEmpty();
	req.checkBody('rollno','Roll Number is required').notEmpty();
	req.checkBody('email','Email is required').notEmpty();
	req.checkBody('email','Email is not valid').isEmail();
	req.checkBody('password','Password is required').notEmpty();
	req.checkBody('confirm_password','Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		req.flash('error',errors);
		res.redirect('/');

		console.log(errors);
	}
	else{
		User.getUserByEmail(email, function(err, user){
			if(err) throw err;
			if(user) {
				console.log(user);
				console.log("user already Exist");
				req.flash('error_msg', 'The Email Id is already registered');
				res.redirect('/');
			}
			else {
				var newUser = new User({
					name: name,
					rollno: rollno,
					email: email,
					password: password
				});

				User.createUser(newUser,function(err,user){
					if(err) throw err;
					console.log(user);
				});
				console.log('registered');
				req.flash('success_msg','Registration Successfull: Now you can login to your account');
				res.redirect('/');
			}
		});
	}
});

// Support
router.get('/support', function(req, res) {
	if(req.user.user_level == 'student')
		res.render('support', {layout:'layout.handlebars'});
	else if(req.user.user_level == 'admin')
		res.render('support', {layout:'layoutb.handlebars'});
});

//Change password
router.get('/ChangePassword',ensureAuthenticated,function(req,res){
	if(req.user.user_level == 'student')
		res.render('ChangePassword', {layout:'layout.handlebars'});
	else if(req.user.user_level == 'admin')
		res.render('ChangePassword', {layout:'layoutb.handlebars'});
});

//Change Password
router.post('/ChangePasswordFunction',ensureAuthenticated,function(req,res){
	var Curr = req.body.CurrentPassword;
	var newpass = req.body.NewPassword;
	var conpass = req.body.ConfirmPassword;
	var CurrUser= req.user;
	console.log(Curr);
	console.log(newpass);
	console.log(conpass);
	console.log(CurrUser);
	//Validation
	// req.checkBody('Curr','Old Password is required').notEmpty();
	// req.checkBody('newpass','New Password is required').notEmpty();
	// req.checkBody('conpass','Confirm Password is required').notEmpty();
	//req.checkBody('conpass','Passwords do not match').equals(req.body.NewPassword);

	//var errors = req.validationErrors();

	// if(errors){
	// 	console.log(errors);
	// 	req.flash('error_msg', 'Invalid Credentials!');
	// 	res.redirect('/users/ChangePassword');
	// }
	// else{
	if(Curr == '' || newpass == '' || conpass == '') {
		req.flash('error_msg', 'Please enter the required fields!');
		res.redirect('/users/ChangePassword');
	}
	else {
		if(newpass != conpass) {
			req.flash('error_msg', 'Passwords do not match!');
			res.redirect('/users/ChangePassword');
		}
	}
	
		User.comparePassword(md5(Curr),req.user.password,function(err,isMatch){
			if(err) throw err;
			console.log(isMatch);
			if(!isMatch){
				console.log("Password Not Match :(");
				return done(null,false,{message: 'Invalid Password'});
			}
			else {
				if(CurrUser.password != md5(Curr)) {
					req.flash('error_msg', 'Wrong old password!');
					res.redirect('/users/ChangePassword');
				}
				else {
					User.updateUsersPassword(CurrUser, md5(newpass), function(err,user){
						if(err) throw err;
						console.log(req.user);
						req.flash('success_msg', 'Password Updated!');
						res.redirect('/users/ChangePassword');
					});
				}
			}
		});
	// }
});

//login using local-strategy
passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
  function(username, password, done) {
	User.getUserByEmail(username,function(err,user){
		if(err) throw err;

		// var entered_password = md5(password);
		if(!user) {
			console.log("User Not Found !");
			return done(null,false,{message: 'Unknown user'})
		}
		else{
			console.log("User Found :)");
			console.log(user.password);
			if(User.comparePassword(md5(password),user.password,function(err,isMatch){
				if(err) throw err;
				console.log(isMatch);
				if(!isMatch){
					console.log("Password Not Match :(");
					return done(null,false,{message: 'Invalid Password'});
				}
				else{
					console.log("Logged In :)");
					return done(null,user);
				}
			}));

		}
	});
	}
));

//Serialization
passport.serializeUser(function(user, done) {
	console.log(user);
  done(null, user.id);
});

//Deserialization
passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

//login
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err)
    if (!user) {
			req.flash('error_msg', 'Invalid Details');
      return res.redirect('/')
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/users/dashboard');
    });
  })(req, res, next);
});

//Dashboard
router.get('/dashboard',ensureAuthenticated,function(req,res){
	console.log('dashboard');
	if(req.user.user_level=="student"){
		// res.send("Logged In As Student");
		res.render('student_dashboard');
	}
	else if(req.user.user_level=="admin"){
		console.log("Logged In As Admin");
		res.redirect('/users/placements');
	}
});

//logout
router.get('/logout',ensureAuthenticated, function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/');
});

/*------------------------------------------Student-----------------------------------------*/

//Peronal Profile
router.get('/personal',ensureAuthenticated, function(req, res){
	console.log("On personal Profile");
	res.render('studentPersonalProfile');
});

//Submit Personal Profile
router.post('/submit_personal',ensureAuthenticated,function(req,res){
	var fullname = req.body.fullname;
	var gender = req.body.gender;
	var dob = req.body.dob;
	var mob1 = req.body.mob1;
	var mob2 = req.body.mob2;

	var currUser = req.user;

	var updatedDetails = {
		name: fullname,
		gender: gender,
		date_of_birth: dob,
		phone_no: {
			phone_no1: mob1,
			phone_no2: mob2
		},
		register_level: 1
	};

	User.updateUsersPersonalProfile(currUser,updatedDetails,function(err,user){
		if(err) throw err;
		console.log(req.user);

		req.flash('success_msg', 'Personal Profile Updated');
		res.redirect('/users/personal');
	});
})

//Academic Profile
router.get('/academic', ensureAuthenticated, function(req, res){
	console.log("On Academic Profile");
	res.render('studentAcademicProfile');
});

//Submit academic profile
router.post('/submit_academic', ensureAuthenticated, function(req,res){
	var branch = req.body.branch;
	var percent_10_value = req.body.percent_10_value;
	var percent_12_value = req.body.percent_12_value;
	var percent_diploma_value = req.body.percent_diploma_value;
	var spi_1 = req.body.spi_1;
	var spi_2 = req.body.spi_2;
	var spi_3 = req.body.spi_3;
	var spi_4 = req.body.spi_4;
	var spi_5 = req.body.spi_5;
	var spi_6 = req.body.spi_6;
	var spi_7 = req.body.spi_7;
	var spi_8 = req.body.spi_8;
	var cpi = req.body.cpi;
	var backlogs = req.body.backlogs;
	var currUser = req.user;
	var updatedDetails = {
		branch: branch,
		percent_10_value: percent_10_value,
		percent_12_value: percent_12_value,
		percent_diploma_value: percent_diploma_value,
		spi: {
			spi_1: spi_1,
			spi_2: spi_2,
			spi_3: spi_3,
			spi_4: spi_4,
			spi_5: spi_5,
			spi_6: spi_6,
			spi_7: spi_7,
			spi_8: spi_8,
		},
		backlogs : backlogs,
		cpi: cpi,
		register_level: 2,
		status: "active"
	};
	console.log(updatedDetails);
	User.updateUsersAcademicProfile(currUser,updatedDetails,function(err,user){
		if(err) 
			throw err;
		req.flash('success_msg', 'Academic Profile Updated');
		res.redirect('/users/academic');
	});
});

//About US Profile
router.get('/aboutUs',ensureAuthenticated, function(req, res){
	console.log("On About Us Page");
	if(req.user.user_level=="student")
		res.render('aboutUs');
	else
		res.render('aboutUs', {layout: 'layoutb.handlebars'});
});

//opportunities for me Profile
router.get('/opportunitiesForMe',ensureAuthenticated, function(req, res){
	var currUser = req.user;
	console.log("On opportunities For Me");
	console.log(currUser);
	Company.getUserByOppurtunity(currUser,function(err,result){
		if(err) throw err;
		console.log(result);
		res.render('opportunitiesForMe',{result:result});
	});
});

//opportunities for all Profile
router.get('/opportunitiesForAll',ensureAuthenticated, function(req, res){
	console.log("On opportunities For All");
	var currUser = req.user;
	Company.getAllCompanies(currUser,function(err,result){
		if(err) throw err;
		res.render('opportunitiesForall',{result: result});
	});
});

//opportunities for all Profile
router.get('/applications',ensureAuthenticated, function(req, res){
	console.log("On Aplications page");
	var currUser = req.user;
	var appl=[];
	var appl1=[];
	appl=req.user.application;
	// for (var i = 0; i < application.length; i++) {
	// 	appli[i].push(application[i]);
	// }
	var j = 0;
	for (var i = 0; i < appl.length; i++) {
		Company.getCompanyByid(appl[i],function(err,result){
			if(err) throw err;
			else {
				appl1.push(result);
				if(j == appl.length - 1)
				{
					res.render('applications', {result: appl1});
				}
				j++;
			}
		});
	}
});
//opportunities for all Profile
router.get('/offers',ensureAuthenticated, function(req, res){
	console.log("On Job offers Page");
	var currUser = req.user;
	var appl=[];
	var appl1=[];
	appl=req.user.offers;
	// for (var i = 0; i < application.length; i++) {
	// 	appli[i].push(application[i]);
	// }
	var j = 0;
	for (var i = 0; i < appl.length; i++) {
		Company.getCompanyByid(appl[i],function(err,result){
			if(err) throw err;
			else {
				appl1.push(result);
				if(j == appl.length - 1)
				{
					res.render('offers', {result:appl1});
				}
				j++;
			}
		});
	}
});
//Company Detail Page on Admin Placement Events
router.post('/companyDetail2', function(req, res){
	console.log("On companyDetail offers Page");
	var companyId = req.body.compId;
	console.log(companyId);
	Company.getCompanyByid(companyId,function(err,result){
		if(err)
			throw err;
		if(req.user.user_level == 'student'){
			res.render('CompanyDetail2',{result:result,companyid: companyId});
		}
		else {
			res.render('companyDetailsAdmin',{layout:'layoutb.handlebars',result:result});
		}
	});
});

//Company Detail Page on opportunity for all
router.post('/companyDetail1', function(req, res){
	console.log("On companyDetail offers Page");
	var companyId = req.body.compId;
	console.log(companyId);
	Company.getCompanyByid(companyId,function(err,result){
		if(err)
			throw err;
		if(req.user.user_level == 'student'){
			res.render('CompanyDetail1',{result:result,companyid: companyId});
		}
		else {
			res.render('CompanyDetail1',{layout:'layoutb.handlebars',result:result});
		}
		});
});
//Company Detail Page on opportunity for me
router.post('/companyDetail', function(req, res){
	console.log("On companyDetail offers Page");
	var companyId = req.body.compId;
	console.log(companyId);
	Company.getCompanyByid(companyId,function(err,result){
		if(err)
			throw err;
		if(req.user.user_level == 'student'){
			res.render('CompanyDetail',{result:result,companyid: companyId});
		}
	});
});
//to Apply on opportunity for all
router.get('/apply/:compId',ensureAuthenticated,function(req,res){
	var cid = req.params.compId;
	Company.getCompanyByid(cid,function(err,company){
		if(err) throw err;
		var currUser = req.user;
		console.log(currUser);
		//var flag = 0;
		//var j = 0;
		//for(var i = 0; i < currUser.application.length; i++)
		//{
			// if(currUser.application[i] == cid)
			// {
			// 	flag = 1;
			// 	res.redirect('/users/dashboard');
			// }
			//if(flag == 0 && j == currUser.application.length - 1)
			//{
				Company.updateUsersForRegisteration(cid,currUser,function(err,result){
					if(err) throw err;
					console.log(result);
				});
				User.applyUserForCompany(currUser,cid,function(err,result){
					if(err) throw err;
					console.log(currUser);
					res.redirect('/users/toapply');
				});
			//}
			//j++;
		//}
	});
});
//----------Show Eligible Student List----------

//to attch resume on opportunity for all
router.get('/toapply',ensureAuthenticated, function(req, res){
	console.log("On to apply offers Page");
			res.render('toapply');
});

//Skills for all Profile
router.get('/skills',ensureAuthenticated, function(req, res){
	console.log("On Skills Page");
	res.render('skills');
});

router.post('/addSkill', function(req, res){
	var skill = req.body.skill;
	var currUser = req.user;
	var updatedDetails = {
		skills : skill
	}
	console.log("Adding New Skill: "+skill);
	User.addNewSkill(currUser,updatedDetails,function(err,user){
		if(err) 
			throw err;
		req.flash('success_msg', 'Added succesfully');
		console.log(user);
		res.redirect('/users/skills');
	});
});

router.post('/removeSkill', function(req, res){
	var skill = req.body.skill;
	var currUser = req.user;
	var updatedDetails = {
		skills : skill
	}
	console.log("Removing New Skill");
	console.log(updatedDetails);
	User.removeSkill(currUser,updatedDetails,function(err,user){
		if(err) throw err;
		req.flash('success_msg', 'Remove succesfully');
		console.log(user);
		res.redirect('/users/skills');
	});
});
/*----------------------------------------------Admin------------------------------------------*/

//Placement
router.get('/placements',ensureAuthenticated, function(req, res) {
	if(req.user.user_level == "admin") {
		console.log("On placement offers Page");
		var CurrUser= req.user;
		Company.getAllCompanies(CurrUser,function(err,result) {
			if(err) throw err;
				console.log(result);
			res.render('placements',{layout:'layoutb.handlebars',result:result});
		});
	}
	else
		res.send('<center><h1>You are not authorized to access this page!<h1><center>');
});

//Create Event display
router.get('/createEvent',ensureAuthenticated, function(req, res){
	if(req.user.user_level == "admin") {
		console.log("On Create Event Page");
		var companyid = req.body.id;
		User.getUserByLevel('student',function(err, result){
			if(err) throw err;
			Company.getCompanyByid(companyid,function(err,result){
				res.render('createEvent',{layout:'layoutb.handlebars',result:result});
			});
		});
	}
	else
		res.send("<center><h1>You are not authorized to access this page!<h1><center>");
});

//Edit Event display
router.post('/edit', function(req, res){
	console.log("On Edit Event Page");
	var companyid = req.body.id;
	User.getUserByLevel('student',function(err, result){
		if(err) throw err;
		Company.getCompanyByid(companyid,function(err,result){
			res.render('editEvent', {layout: 'layoutb.handlebars', result: result, id: companyid});
		});
	});
});

router.post('/editEvent', function(req, res) {
	console.log('On Event Edit submission route');
	// var companyId = req.body.id;
	// var companyName = req.body.cName;
	// var position = req.body.position;
	// var type = req.body.type;
	// var package = req.body.package;
	// var branch = req.body.branch;
	// var percent_10 = req.body.percent_10;
	// var percent_12 = req.body.percent_12;
	// var percent_diploma = req.body.percent_diploma;
	// var cpi = req.body.cpi;
	// var backlogs = req.body.backlogs;
	// var positionDetails = req.body.positiondetails;
	// var schedule = req.body.schedule;
	// var addDetails = req.body.additionaldetails;

	// var eligibleStudents = [];
	// User.getAllUsersByOppurtunity(percent_10, percent_12, percent_diploma, cpi, backlogs, branch, function(err, eligible) {
	// 	for (var i = 0; i < eligible.length; i++) {
	// 		eligibleStudents.push(eligible[i]._id);
	// 	}

		Company.findByIdAndUpdate(req.body.id, {$set: {
			name: req.body.cName,
			position: req.body.position,
			position_details: req.body.positionDetails,
			type: req.body.type,
			package: req.body.package,
			criteria: {
				percent_10: req.body.percent_10,
				percent_12: req.body.percent_12,
				percent_diploma: req.body.percent_diploma,
				cpi: req.body.cpi,
				backlogs: req.body.backlogs,
				branch: req.body.branch
			},
			schedule: req.body.schedule,
			additional_details: req.body.additionaldetails,
			status: "open"
			// eligible_students: eligibleStudents
			}, function(err, edit_data) {
				if(err) {
					req.flash('error_msg','Error occured!');
					res.redirect('/');
				}
				else {
					req.flash('success_msg','Company edited succesfully!');
					res.redirect('/users/companyattachments');
				}
			} 
		});
	// });
});

//Create Event Submit
router.post('/submit_event',function(req,res){
	var companyName = req.body.cName;
	var position = req.body.position;
	var type = req.body.type;
	var package = req.body.package;
	var branch = req.body.branch;
	var percent_10 = req.body.percent_10;
	if(percent_10 == "")
		percent_10 = 0;
	var percent_12 = req.body.percent_12;
	if(percent_12 == "")
		percent_12 = 0;
	var percent_diploma = req.body.percent_diploma;
	if(percent_diploma == "")
		percent_diploma = 0;
	var cpi = req.body.cpi;
	if(cpi == "")
		cpi = 0;
	var backlogs = req.body.backlogs;
	var positionDetails = req.body.positiondetails;
	var schedule = req.body.schedule;
	var addDetails = req.body.additionaldetails;

	var eligibleStudents = [];
	User.getAllUsersByOppurtunity(percent_10, percent_12, percent_diploma, cpi, backlogs, branch, function(err, eligible) {
		for (var i = 0; i < eligible.length; i++) {
			eligibleStudents.push(eligible[i]._id);
		};
		var newCompany = new Company({
			name: companyName,
			position: position,
			position_details: positionDetails,
			type: type,
			package: package,
			criteria: {
				percent_10: percent_10,
				percent_12: percent_12,
				percent_diploma: percent_diploma,
				cpi: cpi,
				backlogs: backlogs,
				branch: branch
			},
			schedule: schedule,
			additional_details: addDetails,
			status: "open",
			eligible_students: eligibleStudents
		});
		console.log('submit events');
		Company.createCompany(newCompany,function(err,result){
			if(err) {
				req.flash('error_msg','Error adding company!');
				res.redirect('/users/createEvent');
			} else {
				req.flash('success_msg','Company added succesfully!');
				res.redirect('/users/companyattachments');
				console.log(result);
			}
		});
	});
	
});

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/docs/');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({
	storage: storage
});

//Comapany Attachments
router.get('/companyattachments',ensureAuthenticated,function(req,res){
	res.render('addCompanyAttachments',{layout: 'layoutb.handlebars'});
});

//Company Attachments
router.post('/companyattachmentsUpload', upload.single('file'), (req,res) => {
	console.log(req.files);
	res.redirect('/users/Dashboard');
});

//Students
router.get('/Students',ensureAuthenticated, function(req, res){
	console.log("On Students page");
	User.getUserByLevel('student', function(err, result){
		if(err)
			throw err;
		console.log(result);
		res.render('Students', {layout:'layoutb.handlebars', result:result});
	});
});

//jobOffers
router.get('/JobOffers',ensureAuthenticated, function(req, res){
	console.log("On JobOffers page");
	User.getUserByLevel('student',function(err, result){
		if(err)
			throw err;
		console.log(result);
		res.render('JobOffers', {layout:'layoutb.handlebars', result:result});
	});
});

//InternshipOffers
router.get('/internOffers',ensureAuthenticated, function(req, res){
	console.log("On internOffers page");
	User.getUserByLevel('student',function(err, result){
		if(err)
			throw err;
		console.log(result);
		res.render('InternshipOffers', {layout:'layoutb.handlebars', result:result});
	});
});

//Categories
router.get('/categories',ensureAuthenticated, function(req, res){
	console.log("On Categories Page Page");
	res.render('categories', {layout:'layoutb.handlebars'});
});

//View each company's detail
router.post('/companydetails',function(req,res){
	var companyId = req.body.compId;
	Company.getCompanyByid(companyId,function(err,result){
		console.log(companyId);
		res.render('companyDetailsAdmin',{layout:'layoutb.handlebars',result:result,companyid: companyId});
	});
});

//Show eligible students
router.post('/showeligible',function(req,res){
	var companyId = req.body.id;
	Company.getCompanyByid(companyId,function(err,company){
		var students = [];
		var j = 0;
		for(var i = 0;i<company.eligible_students.length;i++)
		{
			User.getUserById(company.eligible_students[i],function(err,result){
				students.push(result);
				if(j == company.eligible_students.length - 1) {
					console.log(students);
					res.render('showEligibleStudents',{layout:'layoutb.handlebars', result:students, companyid:companyId});
				}
				j++;
			});
		}
	});
});

//show registered students
router.post('/showregistered', function(req, res) {
	var companyId = req.body.id;
	Company.getCompanyByid(companyId, function(err, company) {
		var students = [];
		console.log(company.registered_students.length);
		var i = 0;
		for(var j = 0; j < company.registered_students.length; j++) {
			User.getUserByEmail(company.registered_students[j], function(err, result) {
				students.push(result);
				if(i == company.registered_students.length - 1) {
					console.log(students);
					res.render('showRegisteredStudents', {layout: 'layoutb.handlebars', result: students, companyid: companyId});
				}
				i++;
			});
		}
	});
});

//Set Offered Student
router.post('/setOffered',function(req,res){
	var companyId = req.body.id;
	var studentList = req.body.studentList;
	var students = [];
	console.log(studentList);
	var j = 0;
	for(var i = 0;i<studentList.length;i++)
	{
		Company.updateOfferedStudents(companyId,studentList[i],function(err,result){});
	}
	for(var i = 0;i<studentList.length;i++)
	{
		console.log(studentList[i],"ftfyf");
		User.UpdateStudentOffers(studentList[i],companyId,function(err,result){
			console.log(result);
		});
		if(j == studentList.length - 1) {
			res.redirect('/');
		}
		j++;
	}
});

//Display students details
router.post('/viewstudent',function(req,res){
	var id = req.body.student;
	console.log(id);

	User.getUserById(id,function(err,result){
		res.render('showStudentDetails',{layout:'layoutb.handlebars',result: result});
	});
});

//Suspend Student
router.post('/changeStatus',function(req,res){
	var id = req.body.student;

	User.getUserById(id,function(err,result){
		if(err) throw err;

		if(result.status=='active')
			result.status = 'suspend';
		else if(result.status=='suspend')
			result.status = 'active';

		console.log(result.status);
	});
});

module.exports = router;