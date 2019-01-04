const xss = require("xss");
const {Channels} = require("../models");

async function getUserChannels(userEmail,permissionLevel=1){
  const data = await Channels.findAll({
    raw: true,
  });
  for(const channel of data){
    channel.members = channel.members.filter(x => x.length>0);
    channel.subjects = channel.subjects.filter(x => x.length>0);
    channel.admins = channel.admins.filter(x => x.length>0);
  }
  if(userEmail==="*"){
    return data;
  }
  for(const channel of data){
    if(channel.roots.includes(userEmail)){
      channel.permissions = 3;
      //We want the highest permissions
      continue;
    }
    if(channel.admins.includes(userEmail)&&permissionLevel<=2){
      channel.permissions = 2;
      continue;
    }
    if(channel.members.includes(userEmail)&&permissionLevel<=1){
      channel.permissions = 1;
      continue;
    }
  }
  return data.filter(channel => channel.permissions!==undefined);
}

async function addTag(channel,tagName,tagColor){
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }));
  if(originalDataArray.length==0){
    throw new Error("Channel does not exist");
  }
  const originalData = originalDataArray[0];
  tagName = xss(tagName);
  tagColor = xss(tagColor);
  //Ensure that tag does not already exist
  const existingTags = originalData.tags;
  if(Object.keys(existingTags).includes(tagName)){
    throw new Error(`Tag ${tagName} already exists.`);
  }
  if(Object.values(existingTags).includes(tagColor)){
    throw new Error(`A tag with color ${tagColor} already exists.`);
  }
  originalData.tags[tagName] = tagColor;
  return Channels.update(originalData,{
    where:{
      name:originalData.name
    }
  });
}
  
async function addSubject(channelData){
  let {channel,data,subject} = channelData;
  const days = ["mon","tue","wed","thu","fri"];
  subject = xss(subject);
  const isValidTime = time => parseInt(time) === time && time >= 0 && time < 2400;
  //Validation
  const timetableDays = Object.keys(data);
  for(const day of timetableDays){
    if(!days.includes(day)){
      throw new Error(`${day} is invalid`);
    }
    const times = data[day];
    for(const timing of times){
      if(!(timing.every(isValidTime))){
        throw new Error(`${timing} is invalid`);
      }
    }
  }
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }));
  if(originalDataArray.length===0){
    throw new Error("Channel does not exist");
  }
  const originalData = originalDataArray[0];
  originalData.timetable = (originalData.timetable || {});
  originalData.timetable[subject] = data;
  originalData.subjects.push(subject);
  return Channels.update(originalData,{
    where:{
      name:channel
    }
  });
}

async function removeSubject(channelData){
  let {channel,subject} = channelData;
  subject = xss(subject);
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }));
  if(originalDataArray.length===0){
    throw new Error("Channel does not exist");
  }

  const originalData = originalDataArray[0];
  const index = originalData.subjects.indexOf(subject);
  if (index > -1) {
    originalData.subjects.splice(index, 1);
  }
  delete originalData.timetable[subject];
  return Channels.update(originalData,{
    where:{
      name:channel
    }
  });
}
async function removeMember(channel,member){
  member += "@nushigh.edu.sg";
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }));
  if(originalDataArray.length===0){
    throw new Error("Channel does not exist");
  }
  const originalData = originalDataArray[0];
  const remove = (array,value) =>{
    const index = array.indexOf(value);
    if(index===-1){
      throw new Error("Member does not exist");
    }
    array.splice(index,1);
    return array;
  };
  if(originalData.roots.includes(member)){
    originalData.roots = remove(originalData.roots,member);
    if(originalData.roots.length === 0){
      throw new Error("There must be at least 1 root in the channel.");
    }
  }else if(originalData.admins.includes(member)){
    originalData.admins = remove(originalData.admins,member);
  }else if(originalData.members.includes(member)){
    console.log(originalData.members,member);
    originalData.members = remove(originalData.members,member);
  }else{
    throw new Error("Member does not exist");
  }
  return Channels.update(originalData,{
    where:{
      name:originalData.name
    }
  });
}
async function addMember(channel,members,permissionLevel){
  const permissionToNumber = lvl => {
    const index = ["member","admin","root"].indexOf(lvl);
    if(index===-1){
      throw new Error("Permission level invalid");
    }
    return index+1;
  };
  const numberToPermission = number => ["members","admins","roots"][number-1];
  const originalDataArray = (await Channels.findAll({
    where:{
      name:channel
    },
    raw: true
  }));
  if(originalDataArray.length===0){
    throw new Error("Channel does not exist");
  }
  const originalData = originalDataArray[0];
  const getPermissionLvl = email => {
    if(originalData.roots.includes(email)){
      return 3;
    }else if(originalData.admins.includes(email)){
      return 2;
    }else if(originalData.members.includes(email)){
      return 1;
    }else{
      return 0;
    }
  };
  const targetRole = originalData[permissionLevel+"s"];
  //The target permission level
  const permissionLvl = permissionToNumber(permissionLevel);
  for(let member of members){
    //Input does not contain emails
    member = member + "@nushigh.edu.sg";
    const currentPermissionLvl = getPermissionLvl(member);
    //Member is not in channel yet
    if(currentPermissionLvl===0){
      targetRole.push(member);
      continue;
    }
    //Member already in target role
    if(targetRole.includes(member)){
      continue;
    }
    const currentPermissionLvlArray = originalData[numberToPermission(currentPermissionLvl)];
    //Target permission lvl > existing permission lvl
    //Remove from existing and add to new
    if(permissionLvl > currentPermissionLvl ){
      const index = currentPermissionLvlArray.indexOf(member);
      currentPermissionLvlArray.splice(index,1);
      targetRole.push(member);
      continue;
    }
  }
  return Channels.update(originalData,{
    where:{
      name:originalData.name
    }
  });
}

module.exports = {
  getUserChannels,
  addSubject,
  removeSubject,
  addMember,
  removeMember,
  addTag
};