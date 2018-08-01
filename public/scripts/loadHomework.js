//Load cached data before websocket connects
//Allows for faster loading of updated data
worker.postMessage({
  type:"get",
}).then(data=>{
  console.log("Load homework from Indexeddb")
  if(channel!=""){
    //Only show homework for current channel
    data = data.filter(a=>a.channel == channel)
  }
  if(!data.length){
    //IndexedDB is empty, perhaps is first page load
    return
  }
  reRender(data)
})

if(typeof conn!="undefined"){
  //Connected before page load
  conn.emit("isReady",null,loadHomework)
}