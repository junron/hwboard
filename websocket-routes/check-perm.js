const {getUserChannel} = require("../controllers");
const {isObject} = require("../utils");
const {getPermissionLvl} = require("../websocket");
async function typeChecking(msg){
  if(!isObject(msg)){
    throw "Message is not an object";
  }
  if(typeof msg.channel!="string"){
    throw "Channel is not a string"; 
  }
}
//Function to validate payload and permissions
async function checkPermissions(socket,msg,minPermissionLevel=2){
  const channelName = msg.channel;
  //Check if user is authorised
  const channel = await getUserChannel(socket.username,channelName);
  if(!channel){
    throw "Channel does not exist";
  }
  const permission = getPermissionLvl(socket.username,channel);
  if(permission < minPermissionLevel){
    throw "403: Forbidden";
  }
}
async function checkPayloadAndPermissions(socket,msg,minPermissionLevel=2){
  await typeChecking(msg);
  await checkPermissions(socket,msg,minPermissionLevel);
  //Set defaults
  //Dont use name, use email. Never use email or name as primary key.
  //Collisions like Cheng Yi may occur
  msg.lastEditPerson = socket.username;
  msg.isTest = msg.isTest || false;
  msg.tags = msg.tags || [];
  if(msg.isTest){
    msg.tags.push("Graded");
  }
  if(Object.values(msg).indexOf(null)>-1){
    throw "Params cannot be null";
  }
  return msg;
}
module.exports = checkPayloadAndPermissions;
