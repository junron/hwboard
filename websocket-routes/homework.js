/* 
 * This file deals with homework operations
 * This includes:
 * - Adding homework -> addReq
 * - Editing homework -> editReq
 * - Removing homework -> deleteReq
 * - Getting homework -> dataReq
 */

const checkPayloadAndPermissions = require("./check-perm");
const {isObject} = require("../utils");
const crypto = require('crypto');
const replication = require("./replication");
const db = require("../controllers");

const checkHomeworkValid = homework => {
  if(!isObject(homework)){
    throw "Homework is not an object";
  }
  if(typeof homework.text !== "string"){
    throw "Homework text is not a string";
  }
  if(homework.text.trim().length === 0){
    throw "Homework text length is 0";
  }
  if(homework.dueDate==="Unknown"){
    homework.dueDate = new Date(2099,11,31);
  }
  if(!homework.dueDate || new Date(homework.dueDate).toString()==="Invalid Date"){
    throw "Homework date is not valid";
  }
  if(new Date(homework.dueDate)<=new Date()){
    throw "Homework date must be in the future";
  }
  if(typeof homework.tags !== "object" || !(homework.tags instanceof Array)){
    throw "Homework tags is not an array";
  }
  if(homework.tags.length===0){
    throw "There must be at least 1 homework tag";
  }
  return true;
};

module.exports = (socket,io)=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket);

  //Get homework from database
  socket.on("dataReq",function(msg,callback){
    console.log("Data req")
    ;(async ()=>{
      if(!isObject(msg)){
        throw "Msg is not an object";
      }
      if(typeof msg.removeExpired != "boolean"){
        msg.removeExpired = true;
      }
      //User only requested specific channel
      if(msg.channel){
        //Ensure that user is member of channel
        if(await db.getUserChannel(socket.username,msg.channel)){
          const data = await db.getHomework(msg.channel,msg.removeExpired);
          return callback(null,data);
        }else{
          throw "You are not a member of this channel";
        }
      }else{
        const data = await db.getHomeworkAll(await db.getUserChannels(socket.username,1,true),msg.removeExpired);
        return callback(null,data);
      }
    })()
      .catch(e=>{
        console.log(e);
        throw e;
      })
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
    
  //Add homework
  socket.on("addReq",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg);
      // Preserve homework id for replication
      if(socket.userData.name!=="replication_user") delete msg.id;
      const {channel} = msg;
      if(msg.previousHomeworkHash){
        const currentData = JSON.stringify((await db.getHomework(channel)).filter(homework=>homework.subject===msg.subject));
        const sha512Hasher = crypto.createHash('sha512');
        sha512Hasher.update(currentData);
        const hash = sha512Hasher.digest('base64');
        if(msg.previousHomeworkHash!==hash){
          const e = new Error("Please check if the homework you want to add has already been added");
          e.code = 409;
          callback(e);
          throw e;
        }
      }
      checkHomeworkValid(msg);
      const {dataValues:homework} = await db.addHomework(channel,msg);
      //Notify users
      const data = await db.getHomework(channel);
      io.to(channel).emit("data",{channel,data});
      //Notify user when homework expires
      await db.whenHomeworkExpires(channel,async()=>{
        const data = await db.getHomework(channel);
        io.to(channel).emit("data",{channel,data});
      });
      msg.id = homework.id;
      await replication(socket,"addReq",msg);
      return callback(null);
    })()
      .catch(e => {console.log(e);callback(e.toString());})
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  //Edit homework
  socket.on("editReq",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg);
      const {channel} = msg;
      if(msg.previousHomeworkHash){
        const currentData = JSON.stringify((await db.getHomework(channel)).filter(homework=>homework.id===msg.id));
        const sha512Hasher = crypto.createHash('sha512');
        sha512Hasher.update(currentData);
        const hash = sha512Hasher.digest('base64');
        if(msg.previousHomeworkHash!==hash){
          const e = new Error("Please check if the homework you want to edit has not already been edited.");
          e.code = 409;
          callback(e);
          throw e;
        }
      }
      checkHomeworkValid(msg);
      await db.editHomework(channel,msg);
      //Notify users
      const data = await db.getHomework(channel);
      io.to(channel).emit("data",{channel,data});
      //Notify user when homework expires
      await db.whenHomeworkExpires(channel,async()=>{
        const data = await db.getHomework(channel);
        io.to(channel).emit("data",{channel,data});
      });
      await replication(socket,"editReq",msg);
      return callback(null);
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Delete homework
  socket.on("deleteReq",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg);
      const {channel} = msg;
      if(msg.previousHomeworkHash){
        const currentData = JSON.stringify((await db.getHomework(channel)).filter(homework=>homework.id===msg.id));
        const sha512Hasher = crypto.createHash('sha512');
        sha512Hasher.update(currentData);
        const hash = sha512Hasher.digest('base64');
        if(msg.previousHomeworkHash!==hash){
          const e = new Error("Please check if the homework you want to delete has not already been modified.");
          e.code = 409;
          callback(e);
          throw e;
        }
      }
      await db.deleteHomework(channel,msg.id);
      //Notify users
      const data = await db.getHomework(channel);
      io.to(channel).emit("data",{channel,data});
      await replication(socket,"deleteReq",msg);
      return callback(null);
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
};
