//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

const {REPLICATION_HOSTS:repHosts,REPLICATION_PASSWORD:repPass} = require("../loadConfig");

//Load models and stuffs
const {sequelize} = require("../models");

const admin = require("./admin");
const homework = require("./homework");
const channel = require("./channel");

//Generate tables
async function init(){
  await sequelize.sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}

let exported = {
  init,
  sequelize
};

if(repHosts.length>0 && repPass.length>0){
  // Override init method to sync with rep host
  exported = Object.assign({replication:require("./replication")},exported);
}
module.exports = {...exported,...admin,...channel,...homework};