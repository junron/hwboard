//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize,Sequelize,Channels,Homework} = require("./models")

//Prevent xss
const xss = require('xss')

//Object to store hwboard channel tables
const tables = {}

//Generate tables
async function init(){
  await generateHomeworkTables()
  return sequelize.sync()
}

//Creates tables based on `Homework` model dynamically
async function generateHomeworkTables(){
  const channels = await getUserChannels("*")
  for (let channel of channels){
    //Could have curried but meh
    tables[channel.name] = Homework(sequelize,Sequelize,channel.name)
  }
}
async function getUserChannels(userEmail,permissionLevel=1){
  //Argh teach me how does one select only if value is in postgres array
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
      //We want the highest permissions
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
//Check authorization before calling
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
async function addSubject(channelData){
  let {channel,data,subject} = channelData
  const days = ["mon","tue","wed","thu","fri"]
  subject = xss(subject)
  const isValidTime = time => parseInt(time) === time && time >= 0 && time < 2400
  //Validation
  const timetableDays = Object.keys(data)
  for(const day of timetableDays){
    if(!days.includes(day)){
      throw new Error(`${day} is invalid`)
    }
    const times = data[day]
    for(const timing of times){
      if(!(timing.every(isValidTime))){
        throw new Error(`${timing} is invalid`)
      }
    }
  }
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }))
  if(originalDataArray.length==0){
    throw new Error("Channel does not exist")
  }
  const originalData = originalDataArray[0]
  originalData.timetable = (originalData.timetable || {})
  originalData.timetable[subject] = data
  originalData.subjects.push(subject)
  return Channels.update(originalData,{
    where:{
      name:channel
    }
  })
}
async function removeMember(channel,member){
  member += "@nushigh.edu.sg"
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }))
  if(originalDataArray.length==0){
    throw new Error("Channel does not exist")
  }
  const originalData = originalDataArray[0]
  const remove = (array,value) =>{
    const index = array.indexOf(value)
    if(index==-1){
      throw new Error("Member does not exist")
    }
    array.splice(index,1)
    return array
  }
  if(originalData.roots.includes(member)){
    originalData.roots = remove(originalData.roots,member)
  }else if(originalData.admins.includes(member)){
    originalData.admins = remove(originalData.admins,member)
  }else if(originalData.members.includes(member)){
    console.log(originalData.members,member)
    originalData.members = remove(originalData.members,member)
  }else{
    throw new Error("Member does not exist")
  }
  return Channels.update(originalData,{
    where:{
      name:originalData.name
    }
  })
}
async function addMember(channel,members,permissionLevel){
  const permissionToNumber = lvl => {
    const index = ["member","admin","root"].indexOf(lvl)
    if(index==-1){
      throw new Error("Permission level invalid")
    }
    return index+1
  }
  const numberToPermission = number => ["members","admins","roots"][number-1]
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }))
  if(originalDataArray.length==0){
    throw new Error("Channel does not exist")
  }
  const originalData = originalDataArray[0]
  const getPermissionLvl = email => {
    if(originalData.roots.includes(email)){
      return 3
    }else if(originalData.admins.includes(email)){
      return 2
    }else if(originalData.members.includes(email)){
      return 1
    }else{
      return 0
    }
  }
  const targetRole = originalData[permissionLevel+"s"]
  //The target permission level
  const permissionLvl = permissionToNumber(permissionLevel)
  for(let member of members){
    //Input does not contain emails
    member = member + "@nushigh.edu.sg"
    const currentPermissionLvl = getPermissionLvl(member)
    //Member is not in channel yet
    if(currentPermissionLvl==0){
      targetRole.push(member)
      continue
    }
    //Member already in target role
    if(targetRole.includes(member)){
      continue
    }
    const currentPermissionLvlArray = originalData[numberToPermission(currentPermissionLvl)]
    //Target permission lvl > existing permission lvl
    //Remove from existing and add to new
    if(permissionLvl > currentPermissionLvl ){
      const index = currentPermissionLvlArray.indexOf(member)
      currentPermissionLvlArray.splice(index,1)
      targetRole.push(member)
      continue
    }
  }
  return Channels.update(originalData,{
    where:{
      name:originalData.name
    }
  })
}
async function getHomeworkAll(channels,removeExpired=true){
  const homeworkPromises = []
  const channelNames = Object.keys(channels)
  for (const name of channelNames){
    homeworkPromises.push(getHomework(name))
  }
  const homework2d = await Promise.all(homeworkPromises)
  //Join array of array of homework into single array of homework
  return [].concat(...homework2d)
}

async function addHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName]
  //Very important step...
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
const arrayToObject = channelArrays => {
  const result = {}
  for (const channel of channelArrays){
    result[channel.name] = channel
  }
  return result
}
const getNumTables = () => {
  return Object.keys(tables).length
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
  addMember,
  arrayToObject,
  removeMember,
  addSubject,
  getNumTables
}
