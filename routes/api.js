const express = require('express')
const router = express.Router()
const authChannels = require("./authChannels")
const db = require("../database")
const EventEmitter = require('events');
const auth = require("../auth")
const io = require("../websocket").createServer

class socketIO extends EventEmitter {}

//TODO: change to post
router.get("/api/:method",(req, res, next) => {
  ;(async ()=>{
    const socket = new socketIO()
    const {method} = req.params
    console.log(method)
    socket.on("uncaughtError",err=>{
      res.status(500).end(err)
    })
    try{
      const token = req.signedCookies.token
      const tokenClaims = await auth.verifyToken(token)
      socket.userData = tokenClaims
      const channels = await db.getUserChannels(socket.userData.preferred_username)
      //Client cannot access socket object, so authorization data is safe and trustable.
      socket.channels = {}
      for (let channel of channels){
        //Add user to rooms
        //Client will receive relevant events emitted to these rooms,
        //but not others
        socket.channels[channel.name] = channel
      }
    }catch(e){
      console.log(e)
      //Problem with token, perhaps spoofed token?
      //Anyway get rid of this socket
      console.log("Forced disconnect")
      return res.status(403).end("Auth error")
    }
    //Admininstration
    require("../websocket-routes/admin")(socket,io,db)

    //Homework ops
    require("../websocket-routes/homework")(socket,io,db)

    //Stats
    require("../websocket-routes/analytics")(socket,db)

    //For tests
    require("../websocket-routes/tests")(socket)
    if(method=="whoami"){
      socket.emit("whoami",null,function(err,data){
        if(err) throw err
        console.log(data)
        return res.end(data)
      })
    }else if(method=="dataReq"){
      console.log(sokcet.channels)
      socket.emit("dataReq",{channel:"M18207"},function(err,data){
        if(err) throw err
        console.log(data)
        return res.end(data)
      })
    }else{
      return res.status(400).end("Invalid method")
    }
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

module.exports = router