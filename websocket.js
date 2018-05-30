const db = require("./database")
const auth = require("./auth")
const cookieParser = require('socket.io-cookie-parser')

//export so that accessible in app.js
//server param is a http server
exports.createServer = function(server){
  //Create websocker server from http server
  const io = require('socket.io')(server)

  //Load hwboard configuration
  const {CI:testing,HOSTNAME,PORT:port} = require("./loadConfig")

  //Prevent CSRF (sort of) by only allowing specific origins
  //Could origin spoofing be possible?
  io.origins((origin,callback)=>{
    const origins = ["https://"+HOSTNAME,"http://localhost:"+port]
    if(testing){
      //Socket-io client origin is * for some reason
      //TODO find out why and avoid if possible
      origins.push("*")
    }
    if(!origins.includes(origin)){
      console.log("\033[0;31mOrigin "+origin+" was blocked\033[0m")
      return callback("Not authorised",false)
    }
    console.log("\033[0;32mOrigin "+origin+" was authorised\033[0m")
    callback(null,true)
  })

  io.set('transports', ['websocket'])
  //For cookies
  io.use(cookieParser())
  io.on('connection', function(socket){
    //Start socket.io code here
    //Authenticate user on connection
    //You can access cookies in websockets too!
    const token = socket.request.cookies.token
    if(testing){
      socket.userData = {
        name:"tester",
        preferred_username:"tester@nushigh.edu.sg"
      }
      socket.channels = [ {
        name: 'testing',
        permissions: 3 }]
      db.getUserChannels(socket.userData.preferred_username).then(function(channels){
        socket.channels = channels
        for (let channel of channels){
          socket.join(channel.name)
        }
      })
    }else{
      auth.verifyToken(token).then(function(tokenClaims){
        socket.userData = tokenClaims
        db.getUserChannels(socket.userData.preferred_username).then(function(channels){
          //Client cannot access socket object, so authorization data is safe and trustable.
          socket.channels = channels
          for (let channel of channels){
            //Add user to rooms
            //Client will receive relevant events emitted to these rooms,
            //but not others
            socket.join(channel.name)
          }
        })
      }).catch(function(e){
        //Problem with token, perhaps spoofed token?
        //Anyway get rid of this socket
        socket.disconnect()
      })
    }
    //Get homework from database
    socket.on("dataReq",async function(msg,callback){
      if(typeof callback!="function"){
        return console.log("Callback is not a function")
      }
      if(typeof msg !="object" || msg==null){
        return callback("Msg is not an object")
      }
      if(typeof msg.removeExpired != "boolean"){
        msg.removeExpired = true
      }
      //User only requested specific channel
      if(msg.channel){
        //Ensure that user is member of channel
        if(socket.channels.find(channel=>{
          return channel == msg.channel
        })){
        db.getHomework(msg.channel,msg.removeExpired).then(function(data){
          return callback(null,data)
        }).catch(function(error){
          console.log(error)
          return callback(error.toString())
        })
      }
      }else{
        db.getHomeworkAll(socket.channels,msg.removeExpired).then(function(data){
          return callback(null,data)
        }).catch(function(error){
          console.log(error)
          return callback(error.toString())
        })
      }
    })

    //Add homework
    socket.on("addReq",function(msg,callback){
      validatePayload(socket.channels,msg,callback).then(async msg =>{
        const {channel} = msg
        await db.addHomework(channel,msg)
        const data = await db.getHomeworkAll(socket.channels)
        io.to(channel).emit("data",data)
        return callback(null)
      }).catch((error) => {
        return callback(error.toString())
      })
    })

    //Edit homework
    socket.on("editReq",function(msg,callback){
      validatePayload(socket.channels,msg,callback).then(async msg =>{
        const {channel} = msg
        await db.editHomework(channel,msg)
        const data = await db.getHomeworkAll(socket.channels)
        io.to(channel).emit("data",data)
        return callback(null)
      }).catch((error) => {
        return callback(error.toString())
      })
    })
    
    //Delete homework
    socket.on("deleteReq",function(msg,callback){
      validatePayload(socket.channels,msg,callback).then(async msg =>{
        const {channel} = msg
        await db.deleteHomework(channel,msg.id)
        const data = await db.getHomeworkAll(socket.channels)
        io.to(channel).emit("data",data)
        return callback(null)
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

    //Function to validate payload and permissions
    async function validatePayload(channelPermissions,msg,callback){
      //type checking
      if(typeof callback!="function"){
        return -1
      }
      if(typeof msg!="object"){
        callback("Message is not an object")
        throw "Message is not an object"
      }
      if(typeof msg.channel!="string"){
        callback("Channel is not a string")
        throw "Channel is not a string" 
      }
      const channelName = msg.channel
      //Check if permission level is 2 or higher
      const channel = channelPermissions.find(channel=>{
        return channel.name==channelName
      })
      if(!channel){
        callback("Channel does not exist")
        throw "Channel does not exist"
      }
      if(channel.permissions<2){
        callback("403: Forbidden")
        throw "403: Forbidden"
      }
      //Dont use name, use email. never use email or name as primary key.
      //Collisions like Cheng Yi may occur
      msg.lastEditPerson = socket.userData.preferred_username
      msg.isTest = msg.isTest||false
      if(Object.values(msg).indexOf(null)>-1){
        callback("Params cannot be null")
        throw "Params cannot be null"
      }
      return msg
    }
      //All socket.io code should end here
    })
  return io
}
