//Load config
const {HOSTNAME:hostName,PORT:port,CI:testing,COOKIE_SECRET:cookieSecret} = require("./loadConfig")


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

//routes
const routes = require('./routes/index');
app.use('/', routes);

//Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Show warning for testing mode
//See testing.md
if(testing){
  console.log("\x1b[31m","Hwboard is being run in testing mode.\nUsers do not need to be authenticated to access hwboard or modify hwboard.","\x1b[0m")
}

//Content security policy settings
//"unsafe-inline" for inline styles and scripts, aim to remove
//https://developers.google.com/web/fundamentals/security/csp/
let csp = "default-src 'self';"+
            "script-src 'self' 'unsafe-inline' https://cdn.ravenjs.com https://secure.aadcdn.microsoftonline-p.com;"+
            "style-src 'self' 'unsafe-inline';"+
            `connect-src 'self' https://sentry.io wss://${hostName} ws://localhost:${port} https://login.microsoftonline.com/;` +
            "object-src 'none';"+
            "img-src 'self' data:;"
            if(!process.env.DEV){
              csp += "report-uri https://sentry.io/api/1199491/security/?sentry_key=6c425ba741364b1abb9832da6dde3908;"
            }
app.use(function(req,res,next){
  res.header("Content-Security-Policy",csp)
  next()
})
//express setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
  });
  
  // error handlers
  
  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
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
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
  
  module.exports = app;
  module.exports.server = server;
