//export so that accessible in app.js
exports.createServer = function(server){
const io = require('socket.io')(server);
const db = require("./database")
const cookieParser = require('socket.io-cookie-parser')
io.set('transports', ['websocket'])
io.use(cookieParser())
io.on('connection', function(socket){
  //Start socket.io code here
  //Get homework from database
  socket.on("dataReq",function(msg,callback){
    db.getHomework().then(function(data){
      return callback(null,data)
    }).catch(function(error){
      return callback(error)
    }).catch(function(error){
      //This could be caused by not passing a function as a callback
      console.log("Error could not be handled by callback: \n",error)
    })
  })

  socket.on("addReq",function(msg,callback){
    //You can access cookies in websockets too!
    const cookies = socket.request.cookies
    //Use msg.token if cookies cannot be set, eg in CI environment
    const token = cookies.token || msg.token
    //Check auth here
    //TODO actually check auth token
    if(token){
      db.addHomework(msg).then(function(){
        return callback(null)
      }).catch(function(error){
        return callback(error)
      }).catch(function(error){
        //This could be caused by not passing a function as a callback
        console.log("Error could not be handled by callback: \n",error)
      })
    }else{
      //Not authorised
      return callback("401: Unauthorised")
    }
  })

  
  //For tests
  socket.on("textMessage",function(msg,callback){
    return callback(null,msg+"received")
  })
  socket.on("binaryMessage",function(msg,callback){
    const text = msg.toString()
    return callback(null,Buffer.from(text+"received","utf8"))
  })
  //All socket.io code should end here
  })
return io
}