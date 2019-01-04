importScripts("/dexie/dist/dexie.min.js");
importScripts("/promise-worker/dist/promise-worker.register.js");
const db = new Dexie("homeworks");
db.version(1).stores({
  homework: "id,subject,dueDate,isTest,text,lastEditTime,lastEditPerson"
});
db.version(2).stores({
  homework: "id,subject,dueDate,isTest,text,lastEditTime,lastEditPerson",
  channels: "id,name,admins,members,roots,subject,timetable,lastEditTime"
}).upgrade();

registerPromiseWorker(function (message) {
  //Homework
  if(message.type=="getSingle"){
    return db.homework.get(message.id);
  }else if(message.type=="set"){
    db.homework.clear();
    return db.homework.bulkPut(message.data);
  }else if(message.type=="get"){
    return db.homework.toArray();
  }else 
  
  //Channels
  if(message.type=="getSingleChannelByName"){
    return db.channels.get({
      name:message.name
    });
  }else if(message.type=="setChannels"){
    db.channels.clear();
    return db.channels.bulkPut(message.data);
  }else if(message.type=="getChannels"){
    return db.channels.toArray();
  }
});