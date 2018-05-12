//export so that accessible in app.js
exports.createServer = function(server){
const io = require('socket.io')(server);
const db = require("./database")
const auth = require("./auth")
const cookieParser = require('socket.io-cookie-parser')
io.set('transports', ['websocket'])
io.use(cookieParser())
io.on('connection', function(socket){
  //Start socket.io code here
  //Get homework from database
  socket.on("dataReq",function(msg,callback){
    if(typeof callback!="function"){
      return console.log("Callback is not a function")
    }
    db.getHomework().then(function(data){
      return callback(null,data)
    }).catch(function(error){
      return callback(error)
    })
  })

  //Add homework
  socket.on("addReq",function(msg,callback){
    //You can access cookies in websockets too!
    const cookies = socket.request.cookies
    validateTokenAndPayload(cookies,msg,callback).then(async msg =>{
      await db.addHomework(msg)
      setTimeout(async ()=>{
        const data = await db.getHomework()
        io.emit("data",data)
        return callback(null)
      },10)
    }).catch((error) => {
      return callback(error.toString())
    })
  })

  //Edit homework
  socket.on("editReq",function(msg,callback){
    //You can access cookies in websockets too!
    const cookies = socket.request.cookies
    validateTokenAndPayload(cookies,msg,callback).then(async msg =>{
      await db.editHomework(msg)
      setTimeout(async ()=>{
        const data = await db.getHomework()
        io.emit("data",data)
        return callback(null)
      },10)
    }).catch((error) => {
      return callback(error.toString())
    })
  })
  
  //Delete homework
  socket.on("deleteReq",function(msg,callback){
    //You can access cookies in websockets too!
    const cookies = socket.request.cookies
    validateTokenAndPayload(cookies,msg,callback).then(async msg =>{
      await db.deleteHomework(msg.id)
      setTimeout(async ()=>{
        const data = await db.getHomework()
        io.emit("data",data)
        return callback(null)
      },10)
    }).catch((error) => {
      return callback(error.toString())
    })
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

  //Helper function to validate token and payload
  async function validateTokenAndPayload(cookies,msg,callback){
    //Use msg.token if cookies cannot be set, eg in CI environment
    const token = cookies.token || msg.token
      
    if(typeof callback!="function"){
      return -1
    }
    if(typeof msg!="object"){
      callback("Message is not an object")
      throw "Message is not an object"
    }
    const decodedToken = await auth.verifyToken(token)
    if(decodedToken){
      //Dont use name, use email. never use email or name as primary key.
      //Collisions like Cheng Yi may occur
      msg.lastEditPerson = decodedToken.preferred_username
      msg.isTest = msg.isTest||false
      if(Object.values(msg).indexOf(null)>-1){
        callback("Params cannot be null")
        throw "Params cannot be null"
      }
      return msg
    }else{
      //Not authorised
      callback("401: Unauthorised")
      throw "401: Unauthorised"
    }
  }
return io
}