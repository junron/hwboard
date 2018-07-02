/* 
 * This file deals with administration operations, 
 * both subject and member-related
 * This includes:
 * - Adding subject -> addSubject
 * - Promoting member -> promoteMember
 * - Demoting member -> demoteMember
 * - Removing member -> removeMember
 * - Adding members -> addMember
 * - Getting channel data -> channelDataReq
 */

const checkPayloadAndPermissions = require("./check-perm")
const {updateChannels,getPermissionLvl} = require("../websocket")


module.exports = (socket,io,db)=>{
  //Add subject
  socket.on("addSubject",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3)
      const {channel} = msg
      await db.addSubject(msg)
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      io.to(channel).emit("channelData",{[channel]:thisChannel})
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })
  //Add member
  socket.on("addMember",function(msg,callback){
    console.log(msg,"attempt to add member")
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3)
      const {channel,students,permissions} = msg
      await db.addMember(channel,students,permissions)
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      io.to(channel).emit("channelData",{[channel]:thisChannel})
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })
  //Remove members
  socket.on("removeMember",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3)
      const {channel,student} = msg
      await db.removeMember(channel,student)
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      io.to(channel).emit("channelData",{[channel]:thisChannel})
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })
  //Promote member
  socket.on("promoteMember",function(msg,callback){
    ;(async ()=>{
      const numberToPermission = number => ["member","admin","root"][number-1]
      const {channel,student} = msg
      const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",socket.channels[channel])
      if(currentPermissionLvl==3){
        throw new Error("Can't promote root")
      }
      if(currentPermissionLvl==0){
        throw new Error("Not a member")
      }
      await db.removeMember(channel,student)
      await db.addMember(channel,[student],numberToPermission(currentPermissionLvl + 1))
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      io.to(channel).emit("channelData",{[channel]:thisChannel})
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })
  //Demote member
  socket.on("demoteMember",function(msg,callback){
    ;(async ()=>{
      const numberToPermission = number => ["member","admin","root"][number-1]
      const {channel,student} = msg
      const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",socket.channels[channel])
      if(currentPermissionLvl==3){
        throw new Error("Can't promote root")
      }
      if(currentPermissionLvl==0){
        throw new Error("Not a member")
      }
      await db.removeMember(channel,student)
      await db.addMember(channel,[student],numberToPermission(currentPermissionLvl - 1))
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      io.to(channel).emit("channelData",{[channel]:thisChannel})
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })

  //Get channel data
  socket.on("channelDataReq",function(msg,callback){
    console.log("request received")
    ;(async ()=>{
      console.log("Request authed")
      console.log(msg)
      msg = await checkPayloadAndPermissions(socket,msg,1)
      const {channel} = msg
      //Update cos why not
      updateChannels(db.arrayToObject(await db.getUserChannels("*")))
      const thisChannel = socket.channels[channel]
      return [null,thisChannel]
    })()
    .then(returnVals => callback(...returnVals))
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(e => console.log(e.toString()))
  })
}
