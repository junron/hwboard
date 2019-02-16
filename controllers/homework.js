const xss = require("xss");
const {Sequelize,Homework} = require("../models");
const {getUserChannels} = require("./admin");
const {CI:testing} = require("../loadConfig");

//Map emails to names
const {getStudentById} = require("../students");

let tables = {};

//Mitigate XSS
async function removeXss(object){
  for (let property in object){
    if(typeof object[property]==="string"){
      object[property] = xss(object[property]);
    }
  }
  return object;
}

//async filter
async function filter(arr, callback) {
  const fail = Symbol();
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail);
}

//Creates tables based on `Homework` model dynamically
async function generateHomeworkTables() {
  const channels = await getUserChannels("*");
  for (let channel of channels){
    //Could have curried but meh
    tables[channel.name] = Homework(channel.name);
  }
}

const getNumTables = () => {
  return Object.keys(tables).length;
};

//Assumes that access has been granted
//Check authorization before calling
async function getHomework(hwboardName,removeExpired=true){
  const Homework = tables[hwboardName];
  if(typeof Homework==="undefined"){
    throw new Error("Homework table could not be found: "+hwboardName);
  }
  const data = await Homework.findAll({
    raw: true
  });
  if(removeExpired){
    return await filter(data,async homework=>{
      if(homework.dueDate >= new Date().getTime()){
        homework.channel = hwboardName;
        let studentName = homework.lastEditPerson;
        try{
          const student = await getStudentById(homework.lastEditPerson.replace("@nushigh.edu.sg",""));
          studentName = student.name;
        }catch(e) {
          console.log("Student not found:",studentName);
        }
        homework.lastEditPerson = studentName;
        return true;
      }
      return false;
    });
  } else {
    for(const homework of data){
      homework.channel = hwboardName;
    }
    return data;
  }
}

async function getNumHomework({channel,subject,graded=0,startDate=new Date(1819,0,2),endDate=new Date(2219,0,2)}){
  const Homework = tables[channel];
  if(typeof Homework==="undefined"){
    throw new Error("Homework table could not be found");
  }
  const Op = Sequelize.Op;
  const where = {
    subject,
  };
  if(graded){
    where.isTest = !(graded===-1);
  }
  if(startDate!==new Date(1819,0,2) && startDate !== endDate){
    where.dueDate = {
      [Op.lte]:endDate,
      [Op.gt]:startDate,
    };
  }
  return Homework.count({where});
}

async function getHomeworkAll(channels,removeExpired=true){
  const homeworkPromises = [];
  const channelNames = Object.keys(channels);
  for (const name of channelNames){
    homeworkPromises.push(getHomework(name,removeExpired));
  }
  const homework2d = await Promise.all(homeworkPromises);
  //Join array of array of homework into single array of homework
  return [].concat(...homework2d);
}

async function addHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName];
  if(typeof Homework==="undefined"){
    throw new Error("Homework table could not be found");
  }
  //Very important step...
  newHomework = await removeXss(newHomework);
  //Disallow invalid subjects
  //Except in testing
  if(!testing){
    const userData = await getUserChannels(newHomework.lastEditPerson);
    const {subjects} = userData.find(channel => channel.name===hwboardName);
    if(!subjects.includes(newHomework.subject)){
      throw new Error("Invalid subject");
    }
  }
  return Homework.create(newHomework);
}

async function editHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName];
  const Op = Sequelize.Op;
  if(typeof Homework==="undefined"){
    throw new Error("Homework table could not be found");
  }
  newHomework = await removeXss(newHomework);
  //Disallow the modification of overdue homework
  //Also disallow invalid subjects
  //Except in testing
  if(!testing){
    const userData = await getUserChannels(newHomework.lastEditPerson);
    const {subjects} = userData.find(channel => channel.name===hwboardName);
    if(!subjects.includes(newHomework.subject)){
      throw new Error("Invalid subject");
    }
    const numCount = await Homework.count({
      where:{
        id:newHomework.id,
        dueDate:{
          [Op.gt]:new Date(),
        }
      }
    });
    if(numCount===0){
      throw new Error("Modification rejected. Either the homework does not exist or it has expired");
    }
  }
  return Homework.update(newHomework,
    {
      where:{
        id:newHomework.id
      }
    });
}
async function deleteHomework(hwboardName,homeworkId){
  const Homework = tables[hwboardName];
  const Op = Sequelize.Op;
  if(typeof Homework==="undefined"){
    throw new Error("Homework table could not be found");
  }
  //Disallow the modification of overdue homework
  //Except in testing
  if(!testing){
    const numCount = await Homework.count({
      where:{
        id:homeworkId,
        dueDate:{
          [Op.gt]:new Date(),
        }
      }
    });
    if(numCount===0){
      throw new Error("Modification rejected. Either the homework does not exist or it has expired");
    }
  }
  return Homework.destroy(
    {
      where:{
        id:homeworkId
      }
    });
}

const expiryTimers = {};
//Get notified when homework expires
async function whenHomeworkExpires(channel,callback){
  const scheduler = require("node-schedule");
  let channelData = await getHomework(channel);
  //We do not want to remove homework that is due when testing
  if(channelData.length===0 || testing){
    return;
  }
  channelData = channelData.sort(function(a,b){
    if(a.dueDate>b.dueDate){
      return -1;
    }else{
      return 1;
    }
  });
  const dueDate = channelData.pop().dueDate;
  console.log({dueDate});
  if(expiryTimers[channel]){
    expiryTimers[channel].cancel();
  }
  expiryTimers[channel] = scheduler.scheduleJob(dueDate,callback);
}

module.exports = {
  getNumTables,
  generateHomeworkTables,
  getHomework,
  getNumHomework,
  getHomeworkAll,
  addHomework,
  editHomework,
  deleteHomework,
  whenHomeworkExpires
};
