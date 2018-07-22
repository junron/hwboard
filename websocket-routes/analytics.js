/* 
 * This file deals with homework statics and analytics, 
 * This includes:
 * - getting homework statics/subject -> homeworkSubjectData
 */

const checkPayloadAndPermissions = require("./check-perm")
const {updateChannels,getPermissionLvl} = require("../websocket")


module.exports = (socket,db)=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket)
  
  const keyValueToArray = (keys,values) =>{
    const result = []
    for(const key of keys){
      result.push([key,values[result.length]])
    }
    return result
  }
  const arrayToObject = array =>{
    const result = {}
    for(const pair of array){
      result[pair[0]] = pair[1]
    }
    return result
  }
  const sortArray = (a,b)=>{
    if(a[1]>b[1]){
      return -1
    }
    if(a[1]<b[1]){
      return 1
    }
    return 0
  }
  //Get homework statistics/subject
  socket.on("homeworkSubjectData",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,1)
      const {channel} = msg
      const subjects = socket.channels[channel].subjects
      const promises = []
      for(const subject of subjects){
        msg.subject = subject
        promises.push(db.getNumHomework(msg))
      }

      const result = await Promise.all(promises)
      const combined = keyValueToArray(subjects,result)
      const sorted = combined.sort(sortArray)
      callback(null,sorted)
      return null
    })()
    .then(callback)
    .catch(e => callback(e.toString()))
    //Error in handling error
    .catch(uncaughtErrorHandler)
  })

  //Get homework statistics/day
  socket.on("homeworkDayData",function(msg,callback){
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,1)
      const {channel} = msg

      const data = await db.getHomework(channel,false)
      const result = {}

      for (const homework of data){
        const date = Math.floor(homework.dueDate.getTime()/(24*60*60*1000))
        if(result[date]){
          result[date]++
        }else{
          result[date]=1
        }
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
