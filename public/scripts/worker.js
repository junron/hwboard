importScripts("./dexie.min.js")
const db = new Dexie("homeworks")
db.version(1).stores({
  homework: "id,subject,dueDate,isTest,text,lastEditTime,lastEditPerson"
})
onmessage = function(event){
  const evtData = event.data
  const {data,type} = evtData
  if(type=="get"){
    db.homework.toArray().then(function(homeworks){
      postMessage({
        type,
        data:homeworks
      })
    }).catch(function(err){
      postMessage({
        type:"error",
        data:err
      })
    })
  }else{
    db.homework.clear()
    db.homework.bulkPut(data).then((result) => {
      postMessage({
        type,
        data:result
      })
    }).catch((err) => {
      postMessage({
        type:"error",
        data:err
      })
    });
  }
}