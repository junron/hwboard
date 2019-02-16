//Load models and stuffs
const {sequelize} = require("../models");
const request = require("request-promise-native");
const {REPLICATION_HOSTS:repHosts,REPLICATION_PASSWORD:repPass} = require("../loadConfig");

const homework = require("./homework");
const admin = require("./admin");

//Generate tables
async function init(){
  const currentLastUpdated = await getLastUpdated();
  if(currentLastUpdated);
  await sequelize.sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}

async function getLastUpdated(){
  const channels = await admin.getUserChannels("*");
  const homework = await homework.getHomeworkAll(channels);
  const data = [...homework,...channels];
  return Math.max(...data.map(a=>new Date(a.lastEditTime)));
}
async function remoteReplication({method,params,user="repuser@nushigh.edu.sg"}){
  const results = [];
  for(const repHost of repHosts){
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
  return results;
}

module.exports = {
  init,
  remoteReplication
};