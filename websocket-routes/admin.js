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
const {getSocketById,getPermissionLvl} = require("../websocket");
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
        roots:[socket.username],
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
      socket.join(name);
      const thisChannel = await db.getUserChannel(socket.username,name);
      socket.emit("channelData",{[name]:thisChannel});
      callback(null,name);
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
        subject:msg.subject,
        startDate: new Date()
      });
      if(numHomework!==0){
        throw new Error("Subjects with homework existing cannot be removed");
      }
      await db.removeSubject(msg);
      const thisChannel = await db.getUserChannel(socket.username,channel);
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  socket.on("editSubject",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel} = msg;
      await db.editSubject(msg);
      const thisChannel = await db.getUserChannel(socket.username,channel);
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
      const k = {};
      if(k[msg.subject]){
        throw new Error("Subject name invalid");
      }
      if(xss(msg.subject)!=msg.subject){
        throw new Error("Subject name invalid");
      }
      await db.addSubject(msg);
      const thisChannel = await db.getUserChannel(socket.username,channel);
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
      const k = {};
      if(k[name]){
        throw new Error("Tag name invalid");
      }
      if(name.trim().length===0){
        throw new Error("Tag name cannot be empty");
      }
      if(!tinycolor(color).isValid()){
        throw new Error("Color is invalid");
      }
      await db.addTag(channel,name,color);
      const thisChannel = await db.getUserChannel(socket.username,channel);
      io.to(channel).emit("channelData",{[channel]:thisChannel});
      return null;
    })()
      .then(callback)
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

  socket.on("removeTag",function(msg,callback){
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel} = msg;
      await db.removeTag(msg);
      const thisChannel = await db.getUserChannel(socket.username,channel);
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
    (async ()=>{
      msg = await checkPayloadAndPermissions(socket,msg,3);
      const {channel,students,permissions} = msg;
      await db.addMember(channel,students,permissions);
      const thisChannel = await db.getUserChannel(socket.username,channel);
      const newMemberSockets = students.map(getSocketById).filter(s=>s!==undefined);
      newMemberSockets.map(socket=>socket.emit("channelData",{[channel]:thisChannel}));
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
      const {channel,students} = msg;
      for(const student of students){
        await db.removeMember(channel,student);
      }
      const allChannels = await db.getUserChannels("*",1,true);
      const thisChannel = allChannels[channel];
      const newMemberSockets = students.map(getSocketById).filter(s=>s!==undefined);
      newMemberSockets.map(socket=>socket.emit("channelData",{[channel]:thisChannel}));
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
      const {channel,students} = msg;
      for (const student of students) {
        const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",await db.getUserChannel(socket.username,channel));
        if(currentPermissionLvl===3){
          throw new Error("Can't promote root");
        }
        if(currentPermissionLvl===0){
          throw new Error("Not a member");
        }
        await db.removeMember(channel,student);
        await db.addMember(channel,[student],numberToPermission(currentPermissionLvl + 1));
      }
      const thisChannel = await db.getUserChannel(socket.username,channel);
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
      const {channel,students} = msg;
      for (const student of students) {
        const currentPermissionLvl = getPermissionLvl(student+"@nushigh.edu.sg",await db.getUserChannel(socket.username,channel));
        if(currentPermissionLvl==1){
          throw new Error("Can't demote member");
        }
        if(currentPermissionLvl==0){
          throw new Error("Not a member");
        }
        await db.removeMember(channel,student);
        await db.addMember(channel,[student],numberToPermission(currentPermissionLvl - 1));
      }
      const thisChannel = await db.getUserChannel(socket.username,channel);
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
        const channels = await db.getUserChannels(socket.username,1,);
        const arrayChannels = [];
        for (const channelName in channels){
          arrayChannels.push(channels[channelName]);
        }
        return [null,arrayChannels];
      }
      msg = await checkPayloadAndPermissions(socket,msg,1);
      const {channel} = msg;
      //Update cos why not
      const thisChannel = await db.getUserChannel(socket.username,channel);
      return [null,thisChannel];
    })()
      .then(returnVals => callback(...returnVals))
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
};
