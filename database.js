//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize,Sequelize,Channels,Homework} = require("./models")

//Prevent xss
const xss = require('xss')

const tables = {}
async function init(){
  await generateHomeworkTables()
  return sequelize.sync()
}

async function generateHomeworkTables(){
  const channels = await getUserChannels("*")
  for (let channel of channels){
    tables[channel.name] = Homework(sequelize,Sequelize,channel.name)
  }
}
async function getUserChannels(userEmail,permissionLevel=1){
  const data = await Channels.findAll({
    raw: true
  })
  if(userEmail=="*"){
    return data
  }
  const authChannels = []
  for(let channel of data){
    if(channel.roots.includes(userEmail)){
      channel.permissions = 3
      authChannels.push(channel)
      continue
    }
    if(channel.admins.includes(userEmail)&&permissionLevel<=2){
      channel.permissions = 2
      authChannels.push(channel)
      continue
    }
    if((channel.members.includes(userEmail)||channel.members.includes("*"))&&permissionLevel<=1){
      channel.permissions = 1
      authChannels.push(channel)
      continue
    }
  }
  return authChannels
}
//Assumes that access has been granted
async function getHomework(hwboardName,removeExpired=true){
  const Homework = tables[hwboardName]
  const data = await Homework.findAll({
    raw: true
  })
  for(const homework of data){
    homework.channel = hwboardName
  }
  if(removeExpired){
    return data.filter((homework)=>{
      return homework.dueDate >= new Date().getTime()
    })
  }else{
    return data
  }
}
async function getHomeworkAll(channels,removeExpired=true){
  const homeworkPromises = []
  for (const channel of channels){
    homeworkPromises.push(getHomework(channel.name))
  }
  const homework2d = await Promise.all(homeworkPromises)
  return [].concat(...homework2d)
}
async function addHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName]
  newHomework = await removeXss(newHomework)
  return Homework.create(newHomework)
}

async function editHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName]
  newHomework = await removeXss(newHomework)
  return Homework.update(newHomework,
    {
    where:{
      id:newHomework.id
    }
  })
}
async function deleteHomework(hwboardName,homeworkId){
  const Homework = tables[hwboardName]
  return Homework.destroy(
    {
    where:{
      id:homeworkId
    }
  })
}
//Mitigate XSS
async function removeXss(object){
  for (let property in object){
    if(typeof object[property]=="string"){
      object[property] = xss(object[property])
    }
  }
  return object
}
module.exports={
  sequelize,
  getHomework,
  addHomework,
  editHomework,
  deleteHomework,
  init,
  getUserChannels,
  getHomeworkAll,
}
