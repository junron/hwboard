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

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket)

  //Add subject
  socket.on("homeworkSubjectData",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,1)
      const {channel} = msg
      const subjects = socket.channels[channel].subjects
      const result = {}
      for(const subject of subjects){
        msg.subject = subject
        result[subject] = await db.getNumHomework(msg)
      }
      callback(null,result)
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })
}
