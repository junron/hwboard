const Raven = require('raven');

let config
let reportErrors
//Catch errors in loading config
try {
  //Load config
  config = require("./loadConfig")
  reportErrors = config.REPORT_ERRORS
}catch(e){
  Raven.config('https://0f3d032052aa41419bcc7ec732bf1d77@sentry.io/1188453').install()
  Raven.captureException(e)
}
if(reportErrors){
  Raven.config('https://0f3d032052aa41419bcc7ec732bf1d77@sentry.io/1188453').install()
}
const {HOSTNAME:hostName,PORT:port,CI:testing,COOKIE_SECRET:cookieSecret} = config

//Utils
const http = require('http')
const express = require("express")
const app = express()
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const websocket = require("./websocket")

//Cookie parser must be before routes
app.use(cookieParser(cookieSecret));

// create servers
const server = http.createServer(app)
const io = websocket.createServer(server)

//Content security policy settings
//"unsafe-inline" for inline styles and scripts, aim to remove
//https://developers.google.com/web/fundamentals/security/csp/
const csp = 
`default-src 'none';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
connect-src 'self' https://sentry.io wss://${hostName} ws://localhost:${port} https://login.microsoftonline.com/;
object-src 'none';
img-src 'self' data:;
base-uri 'none';
form-action 'none';
font-src 'self';
manifest-src 'self';
frame-ancestors 'none';`.split("\n").join("")

app.use(function(req,res,next){
  if(reportErrors){
    const reportURI = "report-uri https://sentry.io/api/1199491/security/?sentry_key=6c425ba741364b1abb9832da6dde3908;"
    res.header("Content-Security-Policy",csp + reportURI)
  }else{
    res.header("Content-Security-Policy",csp)
  }
  //Stop clickjacking
  //https://www.owasp.org/index.php/Clickjacking_Defense_Cheat_Sheet
  res.header("X-Frame-Options","deny")

  //Ask browsers to help detect XSS
  //https://infosec.mozilla.org/guidelines/web_security#x-xss-protection
  res.header("X-XSS-Protection","1; mode=block")
  res.header("X-Content-Type-Options","nosniff")
  res.header("Strict-Transport-Security","max-age=1576800; includeSubDomains")
  res.header("Referrer-Policy","strict-origin")
  res.header("Expect-CT",`max-age=31536000, enforce,  report-uri="https://sentry.io/api/1199491/security/?sentry_key=6c425ba741364b1abb9832da6dde3908"`)
  res.header(`Feature-policy`,`geolocation 'none'; accelerometer 'none';ambient-light-sensor 'none'; sync-xhr 'none'; autoplay 'none'; picture-in-picture 'none';payment 'none'`)
  next()
})

//routes
const resetCache = require('./routes/resetCache');
const exportData = require('./routes/export-data');
const routes = require('./routes/index');
const su = require('./routes/su');
const update = require('./routes/update');
const version = require('./routes/version');
app.use('/', resetCache);
app.use('/', exportData);
app.use('/', routes);
app.use('/', su);
app.use('/', update);
app.use('/', version);

//Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Show warning for testing mode
//See testing.md
if(testing){
  console.log("\x1b[31m","Hwboard is being run in testing mode.\nUsers do not need to be authenticated to access hwboard or modify hwboard.","\x1b[0m")
}

//express setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')))

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
  
  // error handlers
  
  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development' && hostName!="nushhwboard.tk") {
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }
  
  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res, next) => {
    Raven.captureException(err)
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
  
  module.exports= {
    server,
    app,
    io,
  };
