importScripts("./dexie.min.js")
importScripts("./promise-worker.register.js")
const db = new Dexie("homeworks")
db.version(1).stores({
  homework: "id,subject,dueDate,isTest,text,lastEditTime,lastEditPerson"
})
registerPromiseWorker(function (message) {
  if(message.type=="getSingle"){
    return db.homework.get(message.id)
  }else if(message.type=="set"){
    db.homework.clear()
    return db.homework.bulkPut(message.data)
  }else if(message.type=="get"){
    return db.homework.toArray()
  }
});