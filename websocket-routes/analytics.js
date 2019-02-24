/* 
 * This file deals with homework statics and analytics, 
 * This includes:
 * - getting homework statistics by subject -> homeworkSubjectData
 * - getting homework statistics by date  -> homeworkDayData
 */

const checkPayloadAndPermissions = require("./check-perm");
const db = require("../controllers");

module.exports = socket=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket);
  
  const keyValueToArray = (keys,values) =>{
    const result = [];
    for(const key of keys){
      result.push([key,values[result.length]]);
    }
    return result;
  };
  const sortArray = (a,b)=>{
    if(a[1]>b[1]){
      return -1;
    }
    if(a[1]<b[1]){
      return 1;
    }
    return 0;
  };
  //Get homework statistics/subject
  socket.on("homeworkSubjectData",function(msg,callback){
    (async ()=>{
      let subjects = [];
      const promises = [];
      if(msg.channel==""){
        const channels = await db.getUserChannels(socket.username,1,true);
        for(const channelName in channels){
          for(const subject of channels[channelName].subjects){
            msg.subject = subject;
            msg.channel = channelName;
            promises.push(db.getNumHomework(msg));
            subjects.push(subject);
          }
        }
        for(const subject of subjects){
          msg.subject = subject;
        }
      }else{
        msg = await checkPayloadAndPermissions(socket,msg,1);
        const {channel} = msg;
        ({subjects} = await db.getUserChannel(socket.username,channel));
        for(const subject of subjects){
          msg.subject = subject;
          promises.push(db.getNumHomework(msg));
        }
      }

      const result = await Promise.all(promises);
      const combined = keyValueToArray(subjects,result);
      const sorted = combined.sort(sortArray);
      callback(null,sorted);
      return null;
    })()
      .then(callback)
      .catch(e => {console.log(e);callback(e.toString());})
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Get homework statistics/day
  socket.on("homeworkDayData",function(msg,callback){
    (async ()=>{
      let data;
      if(msg.channel ==""){
        data = await db.getHomeworkAll(await db.getUserChannels(socket.username,1,true),false);
      }else{
        msg = await checkPayloadAndPermissions(socket,msg,1);
        const {channel} = msg;
        data = await db.getHomework(channel,false);
      }

      const result = {};
      const upper = Math.floor(new Date(new Date().getFullYear(),11,31).getTime()/(24*60*60*1000));
      const lower = Math.floor(new Date(new Date().getFullYear(),0,1).getTime()/(24*60*60*1000));
      for (const homework of data){
        const date = Math.floor(homework.dueDate.getTime()/(24*60*60*1000));
        if(date>=lower && date<=upper){
          if(result[date]){
            result[date]++;
          }else{
            result[date]=1;
          }
        }
      }
      callback(null,result);
      return null;
    })()
      .then(callback)
      .catch(e => {console.log(e);callback(e.toString());})
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
};
