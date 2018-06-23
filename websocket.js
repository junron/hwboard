const db = require("./database")
const auth = require("./auth")
const cookieParser = require('socket.io-cookie-parser')

//export so that accessible in app.js
//server param is a http server
exports.createServer = async function(server){
  let globalChannels = {}

  const globalChannelData = await db.getUserChannels("*")
  for(const channel of globalChannelData){
    globalChannels[channel.name] = channel
    delete channel.name
  }
  //Create websocker server from http server
  const io = require('socket.io')(server)

  //Load hwboard configuration
  const {CI:testing,HOSTNAME,PORT:port,COOKIE_SECRET:cookieSecret} = require("./loadConfig")

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
  io.use(cookieParser(cookieSecret))
  io.on('connection', async function(socket){
    //Start socket.io code here
    //Authenticate user on connection
    //You can access cookies in websockets too!
    const token = socket.request.signedCookies.token
    if(testing){
      socket.userData = {
        name:"tester",
        preferred_username:"tester@nushigh.edu.sg"
      }
      const {testing} = globalChannels
      socket.channels = {testing}
      const channels = await db.getUserChannels(socket.userData.preferred_username)
      for (const channel of channels){
        socket.join(channel.name)
      }
    }else{
      try{
        const tokenClaims = await auth.verifyToken(token)
        socket.userData = tokenClaims
        const channels = await db.getUserChannels(socket.userData.preferred_username)
        //Client cannot access socket object, so authorization data is safe and trustable.
        socket.channels = {}
        for (let channel of channels){
          //Add user to rooms
          //Client will receive relevant events emitted to these rooms,
          //but not others
          socket.channels[channel.name] = globalChannels[channel.name]
          console.log("Authed")
          socket.join(channel.name)
        }
      }catch(e){
        //Problem with token, perhaps spoofed token?
        //Anyway get rid of this socket
        console.log("Forced disconnect")
        socket.disconnect()
      }
    }
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
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
        if(socket.channel[msg.channel]){
          db.getHomework(msg.channel,msg.removeExpired).then(function(data){
            return callback(null,data)
          }).catch(function(error){
            console.log(error)
            return callback(error.toString())
          })
        }else{
          return callback("You are not a member of this channel")
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
    //Add subject
    socket.on("addSubject",function(msg,callback){
      validatePayload(socket.channels,msg,callback,3).then(async msg =>{
        const {channel} = msg
        await db.addSubject(msg)
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        const thisChannel = globalChannels[channel]
        io.to(channel).emit("channelData",{[channel]:thisChannel})
        return callback(null)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
    })
    //Add member
      socket.on("addMember",function(msg,callback){
	  console.log(msg,"attempt to add member")

      validatePayload(socket.channels,msg,callback,3).then(async msg =>{
        const {channel,students,permissions} = msg
        await db.addMember(channel,students,permissions)
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        const thisChannel = globalChannels[channel]
        io.to(channel).emit("channelData",{[channel]:thisChannel})
        return callback(null)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
    })
    //Remove member
    socket.on("removeMember",function(msg,callback){
      validatePayload(socket.channels,msg,callback,3).then(async msg =>{
        const {channel,student} = msg
        await db.removeMember(channel,student)
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        const thisChannel = globalChannels[channel]
        io.to(channel).emit("channelData",{[channel]:thisChannel})
        return callback(null)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
    })
    //Promote member
    socket.on("promoteMember",function(msg,callback){
      validatePayload(socket.channels,msg,callback,3).then(async msg =>{
        const numberToPermission = number => ["member","admin","root"][number-1]
        const {channel,student} = msg
        const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",globalChannels[channel])
        if(currentPermissionLvl==3){
          throw new Error("Can't promote root")
        }
        if(currentPermissionLvl==0){
          throw new Error("Not a member")
        }
        await db.removeMember(channel,student)
        await db.addMember(channel,[student],numberToPermission(currentPermissionLvl + 1))
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        const thisChannel = globalChannels[channel]
        io.to(channel).emit("channelData",{[channel]:thisChannel})
        return callback(null)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
    })
    //Promote member
    socket.on("demoteMember",function(msg,callback){
      validatePayload(socket.channels,msg,callback,3).then(async msg =>{
        const numberToPermission = number => ["member","admin","root"][number-1]
        const {channel,student} = msg
        const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",globalChannels[channel])
        if(currentPermissionLvl==1){
          throw new Error("Can't demote member")
        }
        if(currentPermissionLvl==0){
          throw new Error("Not a member")
        }
        await db.removeMember(channel,student)
        await db.addMember(channel,[student],numberToPermission(currentPermissionLvl - 1))
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        console.log(socket.channels)
        console.log(socket.channels.M18207===globalChannels.M18207)
        const thisChannel = globalChannels[channel]
        io.to(channel).emit("channelData",{[channel]:thisChannel})
        return callback(null)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
    })
    socket.on("channelDataReq",function(msg,callback){
      console.log("request received")
      validatePayload(socket.channels,msg,callback,1).then(async msg =>{
        console.log("Request authed")
        const {channel} = msg
        //Update cos why not
        updateChannels(db.arrayToObject(await db.getUserChannels("*")))
        console.log({globalChannels})
        const thisChannel = globalChannels[channel]
        return callback(null,thisChannel)
      }).catch((error) => {
        console.log(error)
        return callback(error.toString())
      })
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
    //Function to update globalChannels
    const updateChannels = channels=>{
      for(const channel in channels){
        for(const property in channels[channel]){
          globalChannels[channel][property] = channels[channel][property]
        }
      }
    }
    //Function to get permission level
    const getPermissionLvl = (email,channelData) => {
      if(channelData.roots.includes(email)){
        return 3
      }else if(channelData.admins.includes(email)){
        return 2
      }else if(channelData.members.includes(email)){
        return 1
      }else{
        return 0
      }
    }
    //Function to validate payload and permissions
    async function validatePayload(channelPermissions,msg,callback,minPermissionLevel=2){
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
      //Check if user is authorised
      const channel = channelPermissions[channelName]
      if(!channel){
        callback("Channel does not exist")
        throw "Channel does not exist"
      }
      if(channel.permissions < minPermissionLevel){
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
