//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize} = require("../models");

const admin = require("./admin");
const homework = require("./homework");

//Generate tables
async function init(){
  await sequelize.sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}


module.exports={
  sequelize,
  getHomework:homework.getHomework,
  addHomework:homework.addHomework,
  editHomework:homework.editHomework,
  deleteHomework:homework.deleteHomework,
  init,
  getUserChannels:admin.getUserChannels,
  getUserChannel:admin.getUserChannel,
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
  editSubject:admin.editSubject
};