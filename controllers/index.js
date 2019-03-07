//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize} = require("../models");

const admin = require("./admin");
const homework = require("./homework");
const users = require("./users");
const channel = require("./channel");

//Generate tables
async function init(){
  await sequelize.sync();
  await homework.generateHomeworkTables();
  return sequelize.sync();
}

const exported = {
  init,
  sequelize
};

module.exports = {...exported,...admin,...channel,...homework,...users};
