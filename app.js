//Utils
const http = require('http')
const express = require("express")
const app = express()
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const websocket = require("./websocket")
// create servers
const server = http.createServer(app)
const io = websocket.createServer(server)
//routes
const routes = require('./routes/index');

//Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//express setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
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