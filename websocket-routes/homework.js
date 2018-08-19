/* 
 * This file deals with homework operations
 * This includes:
 * - Adding homework -> addReq
 * - Editing homework -> editReq
 * - Removing homework -> deleteReq
 * - Getting homework -> dataReq
 */

const checkPayloadAndPermissions = require("./check-perm")
const {isObject} = require("../utils")


module.exports = (socket,io,db)=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket)

  //Get homework from database
  socket.on("dataReq",function(msg,callback){
    console.log("Data req")
    ;(async ()=>{
      if(!isObject(msg)){
        throw "Msg is not an object"
      }
      if(typeof msg.removeExpired != "boolean"){
        msg.removeExpired = true
      }
      //User only requested specific channel
      if(msg.channel){
        //Ensure that user is member of channel
        if(socket.channels[msg.channel]){
          const data = await db.getHomework(msg.channel,msg.removeExpired)
          return callback(null,data)
        }else{
          throw "You are not a member of this channel"
        }
      }else{
        const data = await db.getHomeworkAll(socket.channels,msg.removeExpired)
        return callback(null,data)
      }
    })()
    .catch(e=>{
      console.log(e)
      throw e
    })
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })
    
  //Add homework
  socket.on("addReq",function(msg,callback){
    console.log("received")
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg)
      const {channel} = msg
      await db.addHomework(channel,msg)
      //Notify users
      const data = await db.getHomework(channel)
      console.log("yey",channel)
      io.to(channel).emit("data",{channel,data})
      //Notifiy user when homework expires
      await db.whenHomeworkExpires(channel,async()=>{
        const data = await db.getHomework(channel)
        io.to(channel).emit("data",{channel,data})
      })
      return callback(null)
    })()
    .catch(e => {console.log(e);callback(e.toString())})
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })
  //Edit homework
  socket.on("editReq",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg)
      const {channel} = msg
      await db.editHomework(channel,msg)
      //Notify users
      const data = await db.getHomework(channel)
      io.to(channel).emit("data",{channel,data})
      //Notifiy user when homework expires
      await db.whenHomeworkExpires(channel,async()=>{
        const data = await db.getHomework(channel)
        io.to(channel).emit("data",{channel,data})
      })
      return callback(null)
    })()
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })

  //Delete homework
  socket.on("deleteReq",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg)
      const {channel} = msg
      await db.deleteHomework(channel,msg.id)
      //Notify users
      const data = await db.getHomework(channel)
      io.to(channel).emit("data",{channel,data})
      return callback(null)
    })()
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })
}
