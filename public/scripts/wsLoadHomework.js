//Db is init and user is authed
conn.on("ready",loadHomework);

function loadHomework(){
  if(typeof worker==="undefined"){
    worker = new PromiseWorker(new Worker("/scripts/worker.js"))
    console.log("Worker was not initalized.")
    console.log("Worker is now a(n)",typeof worker)
  }
  const promises = []
  promises.push(new Promise((resolve,reject)=>{
    conn.emit("dataReq",channelSettings,function(err,data){
      //Always check if error occurred
      if(err) throw err;
      //Put data into client-side database for caching
      //But only for main page
      if(channel==""){
        console.log("worker is a(n): ",typeof worker)
        console.log({worker})
        console.log("iOS error:",worker," is not initalized")
        worker.postMessage({
          type:"set",
          data
        })
        //Add to localstorage as a fallback
        localStorage.setItem("data",JSON.stringify(data))
      }
      console.log("Load homework from websocket")
      resolve(data)
    })
  }))
  promises.push(new Promise((resolve,reject)=>{
    conn.emit("channelDataReq",{},function(err,data){
      //Always check if error occurred
      if(err) throw err;
      //Put channel data into client-side database for caching and offline access
      worker.postMessage({
        type:"setChannels",
        data
      });
      //Add to localstorage as a fallback
      localStorage.setItem("channelData",JSON.stringify(data))
      setSubjectVariables(data)
      console.log("Load channels from websocket")
      resolve(true)
    })
  }))
  Promise.all(promises).then(data=>{
    if(data[1]===true){
      reRender(data[0])
    }else{
      console.log("Unable to load channel data")
    }
  })
}
//Server pushes data, re-render
conn.on("data",({channel,data:channelData})=>{
  //Add data to client side db
  console.log(channel,channelData)
  console.log("Data is pushed from server")
  updateChannelHomework(channel,channelData).then(newData=>{
    reRender(newData);
  })
});