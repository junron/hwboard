const db = require("./database")
const auth = require("./auth")
const cookieParser = require('socket.io-cookie-parser')


const globalChannels = {}
db.getUserChannels("*").then(globalChannelData=>{
  for(const channel of globalChannelData){
    globalChannels[channel.name] = channel
  }
})
//export so that accessible in app.js
//server param is a http server
exports.createServer = function(server){
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
      if(origin=="*"){
        console.log("\033[0;32mOrigin "+origin+" was authorised\033[0m")
        return callback(null,true)
      }
    }
    for (const authOrigin of origins){
      if(origin.startsWith(authOrigin)){
        console.log("\033[0;32mOrigin "+origin+" was authorised\033[0m")
        return callback(null,true)
      }
    }
    console.log("\033[0;31mOrigin "+origin+" was blocked\033[0m")
    return callback("Not authorised",false)
  })

  //For cookies
  io.use(cookieParser(cookieSecret))
  io.on('connection',function(socket){
    console.log("User connected")
    //Start socket.io code here

    //Authentication
    ;(async ()=>{
      //Authenticate user on connection
      //You can access cookies in websockets too!
      const token = socket.request.signedCookies.token
      const email = socket.request.signedCookies.username || "tester@nushigh.edu.sg"
      if(Object.keys(globalChannels).length ==0){
        const globalChannelData = await db.getUserChannels("*")
        for(const channel of globalChannelData){
          globalChannels[channel.name] = channel
        }
      }
      if(testing){
        //In testing mode
        socket.userData = {
          name:"tester",
          preferred_username:email
        }
        socket.channels = {}
        db.getUserChannels(socket.userData.preferred_username).then(channels=>{
          for (const channel of channels){
            socket.join(channel.name)
            socket.channels[channel.name] = globalChannels[channel.name]
          }
        })
      }else{
        //In production, verify token
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
    })()
    .then(async ()=>{
      //Administration
      require("./websocket-routes/admin")(socket,io,db)

      //Homework ops
      require("./websocket-routes/homework")(socket,io,db)

      //For tests
      require("./websocket-routes/tests")(socket)

      if(db.getNumTables()==0){
        await db.init()
      }
      return socket.emit("ready")
    })
    .catch(console.log)

    socket.on('disconnect', function(){
      console.log('user disconnected')
    })
  })
  return io
}

//Function to update globalChannels
module.exports.updateChannels = channels=>{
  for(const channel in channels){
    for(const property in channels[channel]){
      globalChannels[channel][property] = channels[channel][property]
    }
  }
}
//Function to get permission level
module.exports.getPermissionLvl = (email,channelData) => {
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
