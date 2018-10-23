var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var User = require('../models/user');
var md5 = require('md5');

router.get('/',function(req,res) {
	if(req.isAuthenticated()){
		res.redirect('/users/dashboard');
	}
	else
	{
		res.render('login_signup',{layout: 'layout_login_signup'});
	 	console.log('home page started');
	}
});

router.get('/forgotPassword',function(req,res){
	res.render('forgot',{layout: 'layout_login_signup'});
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgotPassword');
    }
    res.render('reset', {layout:'layout_login_signup',user: req.user,token:req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
	var pass = req.body.password;
	var conpass = req.body.ConfirmPassword;
	console.log(pass);
	console.log(conpass);
	if(req.body.password != req.body.ConfirmPassword){
		req.flash('error_msg','password And Confirm password do not match !!');
		res.redirect('/reset/'+req.params.token);
	}
	else{
		async.waterfall([
	    function(done) {
	      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	        if (!user) {
	          req.flash('error_msg', 'Password reset token is invalid or has expired.');
	          return res.redirect('back');
	        }

	        user.password = md5(req.body.password);
	        user.resetPasswordToken = undefined;
	        user.resetPasswordExpires = undefined;

	        user.save(function(err) {
						if (err) throw new Error(err);
						console.log(user);
						req.flash('success_msg','password Reset Successfully. Now you can login');
	          res.redirect('/');
	        });
	      });
	    },
	    function(user, done) {
	      var smtpTransport = nodemailer.createTransport('SMTP', {
					service: 'Gmail',
	        auth: {
	          user: 'paras.agg98@gmail.com',
	          pass: 'TIkki15021998'
	        }
	      });
	      var mailOptions = {
	        to: user.email,
	        from: 'paras.aggarwal@outlook.com',
	        subject: 'Your password has been changed',
	        text: 'Hello,\n\n' +
	          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('success', 'Success! Your password has been changed.');
	        done(err);
	      });
	    }
	  ], function(err) {
	    res.redirect('/');
	  });
	}
});

router.post('/forgot',function(req,res){
	async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, User) {
        if (!User) {
          req.flash('error_msg', 'No account with that email address exists.');
          return res.redirect('/forgotPassword');
        }

        User.resetPasswordToken = token;
        User.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        User.save(function(err) {
          done(err, token, User);
        });
      });
    },
    function(token, User, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'paras.agg98@gmail.com',
          pass: 'TIkki15021998'
        }
      });
      var mailOptions = {
        to: User.email,
        from: 'paras.agg98@gmail.com',
        subject: 'YMCAUST Placement Cell Password Resets Request',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success_msg', 'An e-mail has been sent to ' + User.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
		req.flash('error_msg', 'Something Went Wrong');
    res.redirect('/forgotPassword');
  });

	req.flash('success_msg', 'An e-mail has been sent to ' + req.body.email + ' with further instructions.');
	res.redirect('/');

});
module.exports = router;
