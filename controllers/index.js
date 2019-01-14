//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize} = require("../models");

const admin = require("./admin");
const homework = require("./homework");
const users = require("./users");

//Generate tables
async function init(){
  await sequelize.sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}

const arrayToObject = channelArrays => {
  const result = {};
  for (const channel of channelArrays){
    result[channel.name] = channel;
  }
  return result;
};

module.exports={
  sequelize,
  init,
  arrayToObject,
  getHomework:homework.getHomework,
  addHomework:homework.addHomework,
  editHomework:homework.editHomework,
  deleteHomework:homework.deleteHomework,
  getUserChannels:admin.getUserChannels,
  getHomeworkAll:homework.getHomeworkAll,
  addMember:admin.addMember,
  removeMember:admin.removeMember,
  addSubject:admin.addSubject,
  getNumTables: homework.getNumTables,
  whenHomeworkExpires:homework.whenHomeworkExpires,
  getNumHomework:homework.getNumHomework,
  removeSubject:admin.removeSubject,
  addTag:admin.addTag,
  removeTag:admin.removeTag,
  addUser:users.addUser,
  removeUser:users.removeUser,
  getUsers:users.getUsers,
  getUserTokens:users.getUserTokens
};