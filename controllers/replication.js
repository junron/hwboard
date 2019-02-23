//Load models and stuffs
const {Channels} = require("../models");
const request = require("request-promise-native");
const {REPLICATION_HOSTS:repHosts,REPLICATION_PASSWORD:repPass} = require("../loadConfig");

const homework = require("./homework");
const admin = require("./admin");

async function sync(){
  const remoteLastReplicated = await Promise.all(
    repHosts.map(h => remoteReplication({
      method: "getLastUpdated",
      rHosts: [h]
    }))
  );
  const remoteLastUpdated = Math.max(remoteLastReplicated);
  const selfLastUpdated = await getLastUpdated();
  if(selfLastUpdated>=remoteLastUpdated){
    // Self more updated than remote or equal
    return;
  }
  console.log("Warning: Remote hosts are more updated. Please sync manually.");
  // const mostUpdatedHost = repHosts[remoteLastReplicated.indexOf(remoteLastUpdated)];
  // const remoteDiff = await remoteReplication({
  //   method: "getDiffDetail",
  //   rHosts: [mostUpdatedHost]
  // });
  // const selfDiff = await getDiffDetail();
  // const promises = [];
  // for(const channel in remoteDiff.channels){
  //   if(selfDiff.channels[channel] === undefined || selfDiff.channels[channel]<new Date(remoteDiff.channels[channel])){
  //     // Remote has more updated channel than us
  //     promises.push((async ()=>{
  //       const data = (await remoteReplication({
  //         method: "channelDataReq",
  //         rHosts: [mostUpdatedHost],
  //         params:{channel},
  //         user:"*"
  //       }))[0];
  //       setChannelData(data);
  //     })());
  //   }
  // }

  // for(const homework in remoteDiff.homework){
  //   if(selfDiff.homework[homework] === undefined || selfDiff.homework[homework]<new Date(remoteDiff.homework[homework])){
  //     // Remote has more updated homework than us
  //     promises.push((async ()=>{
  //       const data = (await remoteReplication({
  //         method: "dataReq",
  //         rHosts: [mostUpdatedHost],
  //         params:{channel:homework.channel,removeExpired:false},
  //         user:"*"
  //       }))[0];
  //       console.log(data)
  //       // setHomeworkData(data);
  //     })());
  //   }
  // }
  // console.log(await Promise.all(promises));
}

async function setChannelData(data){
  await Channels.upsert(data);
}
async function getLastUpdated(){
  const channels = await admin.getUserChannels("*");
  const homeworks = await homework.getHomeworkAll(admin.arrayToObject(channels),false);
  const data = [...homeworks,...channels];
  return Math.max(...data.map(a=>new Date(a.lastEditTime)));
}

async function getDiffDetail(){
  const channels = await admin.getUserChannels("*");
  const homeworks = await homework.getHomeworkAll(admin.arrayToObject(channels),false);
  const homeworkData = {};
  const channelData = {};
  for(const hw of homeworks){
    if(homeworkData[hw.channel]){
      homeworkData[hw.channel] = Math.max(homeworkData[hw.channel],hw.lastEditTime);
    }else{
      homeworkData[hw.channel] = hw.lastEditTime;
    }
  }
  for(const channel of channels){
    channelData[channel.name] = channel.lastEditTime;
  }
  return {channels:channelData,homework:homeworkData};
}

async function remoteReplication({method,params,user="repuser@nushigh.edu.sg",rHosts=repHosts}){
  const results = [];
  for(const repHost of rHosts){
    const protocol = repHost.includes("localhost") ? "http://" : "https://";
    results.push(await request.post(`${protocol}${repHost}/api/${method}`,{
      body:{
        ...params,
        replication:{
          password:repPass,
          user:user
        }
      },
      json:true
    }));
  }
  if(rHosts.length===1){
    return results[0];
  }
  return results;
}

module.exports = {
  remoteReplication,
  getLastUpdated,
  sync,
  getDiffDetail,
  setChannelData
};