//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize,Sequelize,Channels,Homework} = require("./models")
const {CI:testing} = require("./loadConfig")

//Prevent xss
const xss = require('xss')

//Map emails to names
const {getStudentById} = require("./students")

//Object to store hwboard channel tables
const tables = {}

//Generate tables
async function init(){
  await sequelize.sync()
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
  if(userEmail=="*"){
    return Channels.findAll({
      raw: true,
    })
  }
  const Op = Sequelize.Op
  const data = await Channels.findAll({
    raw: true,
    where:{
      [Op.or]:[
        {
          roots:{
            [Op.contains]:[userEmail]
          }
        },
        {
          admins:{
            [Op.contains]:[userEmail]
          }
        },
        {
          members:{
            [Op.contains]:[userEmail]
          }
        }
      ]
    }
  }) 
  if(userEmail=="*"){
    return data
  }
  for(let channel of data){
    if(channel.roots.includes(userEmail)){
      channel.permissions = 3
      //We want the highest permissions
      continue
    }
    if(channel.admins.includes(userEmail)&&permissionLevel<=2){
      channel.permissions = 2
      continue
    }
    if(channel.members.includes(userEmail)&&permissionLevel<=1){
      channel.permissions = 1
      continue
    }
  }
  return data
}
//Assumes that access has been granted
//Check authorization before calling
async function getHomework(hwboardName,removeExpired=true){
  const Homework = tables[hwboardName]
  if(typeof Homework==="undefined"){
    throw new Error("Homework table cound not be found: "+hwboardName)
  }
  const data = await Homework.findAll({
    raw: true
  })
  if(removeExpired){
    return await filter(data,async homework=>{
      if(homework.dueDate >= new Date().getTime()){
        homework.channel = hwboardName
        let studentName = homework.lastEditPerson
        try{
          const student = await getStudentById(homework.lastEditPerson.replace("@nushigh.edu.sg",""))
          studentName = student.name
        }catch(e){
        }
        homework.lastEditPerson = studentName
        return true
      }
      return false
    })
  }else{
    for(const homework of data){
      homework.channel = hwboardName
    }
    return data
  }
}
async function getNumHomework({channel,subject,graded=0,startDate=Infinity,endDate=Infinity}){
  const Homework = tables[channel]
  if(typeof Homework==="undefined"){
    throw new Error("Homework table cound not be found")
  }
  const Op = Sequelize.Op
  const where = {
    subject,
  }
  if(graded){
    if(graded==-1){
      where.isTest = false
    }else{
      where.isTest = true
    }
  }
  if(startDate!=Infinity && startDate != endDate){
    where.dueDate = {
      [Op.lte]:endDate,
      [Op.gt]:startDate,
    }
  }
  return Homework.count({where})
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

//
async function removeSubject(channelData){
  let {channel,subject} = channelData
  subject = xss(subject)
  console.log(channel,subject)
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
  const index = originalData.subjects.indexOf(subject)
  if (index > -1) {
    originalData.subjects.splice(index, 1)
  }
  delete originalData.timetable[subject]
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
    if(originalData.roots.length == 0){
      throw new Error("There must be at least 1 root in the channel.")
    }
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
    homeworkPromises.push(getHomework(name,removeExpired))
  }
  const homework2d = await Promise.all(homeworkPromises)
  //Join array of array of homework into single array of homework
  return [].concat(...homework2d)
}

async function addHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName]
  if(typeof Homework==="undefined"){
    throw new Error("Homework table cound not be found")
  }
  //Very important step...
  newHomework = await removeXss(newHomework)
  //Disallow invalid subjects
  //Except in testing
  if(!testing){
    const userData = await getUserChannels(newHomework.lastEditPerson)
    const {subjects} = userData.find(channel => channel.name===hwboardName)
    if(!subjects.includes(newHomework.subject)){
      throw new Error("Invalid subject")
    }
  }
  return Homework.create(newHomework)
}

async function editHomework(hwboardName,newHomework){
  const Homework = tables[hwboardName]
  const Op = Sequelize.Op
  if(typeof Homework==="undefined"){
    throw new Error("Homework table cound not be found")
  }
  newHomework = await removeXss(newHomework)
  //Disallow the modification of overdue homework
  //Also disallow invalid subjects
  //Except in testing
  if(!testing){
    const userData = await getUserChannels(newHomework.lastEditPerson)
    const {subjects} = userData.find(channel => channel.name===hwboardName)
    if(!subjects.includes(newHomework.subject)){
      throw new Error("Invalid subject")
    }
    const numCount = await Homework.count({
      where:{
        id:newHomework.id,
        dueDate:{
          [Op.gt]:new Date(),
        }
      }
    })
    if(numCount===0){
      throw new Error("Modification rejected. Either the homework does not exist or it has expired")
    }
  }
  return Homework.update(newHomework,
    {
    where:{
      id:newHomework.id
    }
  })
}
async function deleteHomework(hwboardName,homeworkId){
  const Homework = tables[hwboardName]
  const Op = Sequelize.Op
  if(typeof Homework==="undefined"){
    throw new Error("Homework table cound not be found")
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
    })
    if(numCount===0){
      throw new Error("Modification rejected. Either the homework does not exist or it has expired")
    }
  }
  return Homework.destroy(
    {
    where:{
      id:homeworkId
    }
  })
}

const expiryTimers = {}
//Get notified when homework expires
async function whenHomeworkExpires(channel,callback){
  const scheduler = require('node-schedule')
  let channelData = await getHomework(channel)
  //We do not want to remove homework that is due when testing
  if(channelData.length==0 || testing){
    return
  }
  channelData = channelData.sort(function(a,b){
    if(a.dueDate>b.dueDate){
      return -1
    }else{
      return 1
    }
  })
  const dueDate = channelData.pop().dueDate
  console.log({dueDate})
  if(expiryTimers[channel]){
    expiryTimers[channel].cancel()
  }
  expiryTimers[channel] = scheduler.scheduleJob(dueDate,callback)
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

//async filter
async function filter(arr, callback) {
  const fail = Symbol()
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
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
  getNumTables,
  whenHomeworkExpires,
  getNumHomework,
  removeSubject
}
