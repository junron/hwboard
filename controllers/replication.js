//Load models and stuffs
const {sequelize} = require("../models");
const request = require("request-promise-native");
const {REPLICATION_HOSTS:repHosts,REPLICATION_PASSWORD:repPass} = require("../loadConfig");

const homework = require("./homework");
const admin = require("./admin");

//Generate tables
async function init(){
  await sequelize.sync();
  await sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}

async function sync(){
  const remoteLastReplicated = await Promise.all(
    repHosts.map(h => remoteReplication({
      method: "getLastUpdated",
      rHosts: [h]
    }))
  );
  const mostUpdatedHost = repHosts[remoteLastReplicated.indexOf(Math.max(remoteLastReplicated))];
  console.log(mostUpdatedHost);
}

async function getLastUpdated(){
  const channels = await admin.getUserChannels("*");
  const homework = await homework.getHomeworkAll(channels,false);
  const data = [...homework,...channels];
  return Math.max(...data.map(a=>new Date(a.lastEditTime)));
}
async function remoteReplication({method,params,user="repuser@nushigh.edu.sg",rHosts=repHosts}){
  const results = [];
  for(const repHost of rHosts){
    results.push(await request.post(`${repHost}/api/${method}`,{
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
  init,
  remoteReplication,
  getLastUpdated
};