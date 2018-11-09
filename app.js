var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var passport = require('passport');
var localStrategy = require('passport-local-roles').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var multer = require('multer');
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://paras:paras123@ds231133.mlab.com:31133/tp-cell", {
   useMongoClient: true,
});
var db = mongoose.connection;

var route = require('./routes/index');
var user = require('./routes/users');

var app = express();

app.use(fileUpload());

app.set('view engine', 'handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname,'public')));

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/',route);
app.use('/users',user);

app.get('/*', function(req, res) {
  res.send('<center><h1>404</h1><h2>Page not found!</h2></center>');
});

app.set('port',(process.env.PORT || 3000));
app.listen(app.get('port'),function(){
	console.log("Server started on port 3000");
});