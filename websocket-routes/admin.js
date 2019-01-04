/* 
 * This file deals with administration operations, 
 * both subject and member-related
 * This includes:
 * - Adding subject -> addSubject
 * - Removing subject -> removeSubject
 * - Promoting member -> promoteMember
 * - Demoting member -> demoteMember
 * - Removing member -> removeMember
 * - Adding members -> addMember
 * - Adding tags -> addTag
 * - Getting channel data -> channelDataReq
 */

const checkPayloadAndPermissions = require("./check-perm");
const {updateChannels,getPermissionLvl} = require("../websocket");
const {sequelize,Channels} = require("../models");
const tinycolor = require("tinycolor2");
const xss = require("xss");

module.exports = (socket,io,db)=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket);


  socket.on("addChannel",function(msg,callback){
    (async ()=>{
      let name = xss(msg);
      if(encodeURI(name)!==name){
        //Channel will be part of url
        return callback("Channel name invalid");
      }
      const k = {};
      if(k[name]!==undefined){
        //Channel name will be object key
        //Prevent overwriting of built in object properties such as __proto__ and toString
        return callback("Channel name invalid");
      }
      const config = {
        name,
        subjects:[],
        roots:[socket.userData.preferred_username],
        admins:[],
        members:[],
        tags : {
          "Graded" : "red",
          "Optional" : "green"
        }
      };
      const data = await Channels.findAll({
        where:{
          name
        },
        raw: true
      });
      if(data.length>0){
        return callback("Channel already exists");
      }
      //Create channel tables
      await Channels.create(config);
      //Sync to db
      await sequelize.sync();
      await db.init();
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      callback(null,xss(msg));
      //disconnect to refresh channels
      return socket.disconnect();
    })()
      .catch(e => {
        console.log(e);
        throw e;
      })
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Remove subject
  socket.on("removeSubject",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel} = msg;
      const numHomework = await db.getNumHomework({
        channel,
        subject:msg.subject
      });
      if(numHomework!==0){
        throw new Error("Subjects with homework existing cannot be removed");
      }
      await db.removeSubject(msg);
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Add subject
  socket.on("addSubject",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel} = msg;
      await db.addSubject(msg);
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Add tag
  socket.on("addTag",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel,name,color} = msg;
      if(name.trim().length===0){
        throw new Error("Tag name cannot be empty");
      }
      if(!tinycolor(color).isValid()){
        throw new Error("Color is invalid");
      }
      await db.addTag(channel,name,color);
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  //Add member
  socket.on("addMember",function(msg,callback){
    console.log(msg,"attempt to add member")
    ;(async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel,students,permissions} = msg;
      await db.addMember(channel,students,permissions);
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  //Remove members
  socket.on("removeMember",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel,student} = msg;
      await db.removeMember(channel,student);
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  //Promote member
  socket.on("promoteMember",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const numberToPermission = number => ["member","admin","root"][number-1];
      const {channel,student} = msg;
      const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",socket.channels[channel]);
      if(currentPermissionLvl==3){
        throw new Error("Can't promote root");
      }
      if(currentPermissionLvl==0){
        throw new Error("Not a member");
      }
      await db.removeMember(channel,student);
      await db.addMember(channel,[student],numberToPermission(currentPermissionLvl + 1));
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  //Demote member
  socket.on("demoteMember",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const numberToPermission = number => ["member","admin","root"][number-1];
      const {channel,student} = msg;
      const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",socket.channels[channel]);
      if(currentPermissionLvl==1){
        throw new Error("Can't demote member");
      }
      if(currentPermissionLvl==0){
        throw new Error("Not a member");
      }
      await db.removeMember(channel,student);
      await db.addMember(channel,[student],numberToPermission(currentPermissionLvl - 1));
      updateChannels(db.arrayToObject(await db.getUserChannels("*")));
      const thisChannel = socket.channels[channel];
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  //Get channel data
  socket.on("channelDataReq",function(msg,callback){
    (async ()=>{
      //Get channel data from all channels
      if(!msg.channel){
        const channels = await db.getUserChannels(socket.userData.preferred_username);
        const arrayChannels = [];
        for (const channelName in channels){
          arrayChannels.push(channels[channelName]);
        }
        return [null,arrayChannels];
      }
      msg = await checkPayloadAndPermissions(socket,msg,1);
      const {channel} = msg;
      //Update cos why not
      const channels = await db.getUserChannels("*");
      updateChannels(db.arrayToObject(channels));
      const thisChannel = socket.channels[channel];
      return [null,thisChannel];
    })()
      .then(returnVals => callback(...returnVals))
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
};
