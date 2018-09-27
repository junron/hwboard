const hwboard = (()=>{
  //Web worker for indexedDB
  //Use promise based messaging
  worker = new PromiseWorker(new Worker("/scripts/worker.js"))
  /**
   * Gets homework from websocket or cache
   * @param {Boolean} removeExpired Whether to remove expired homework
   */
  async function getHomework(removeExpired=true){
    if(typeof worker==="undefined"){
      worker = new PromiseWorker(new Worker("/scripts/worker.js"))
      console.log("Worker was not initalized.")
      console.log("Worker is now a(n)",typeof worker)
    }
    const promises = []
    if(typeof conn !== "undefined"){
      promises.push(new Promise((resolve,reject)=>{
        const settings = Object.assign({},channelSettings)
        settings.removeExpired = removeExpired
        conn.emit("dataReq",settings,function(err,data){
          //Always check if error occurred
          if(err) throw err;
          //Put data into client-side database for caching
          //But only for main page
          if(channel==""){
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
    }
    promises.push(worker.postMessage({
      type:"get",
    }).then(data=>{
      console.log("Load homework from Indexeddb")
      if(channel!=""){
        //Only show homework for current channel
        data = data.filter(a=>a.channel == channel)
      }
      if(!data.length){
        //IndexedDB is empty, perhaps is first page load
        return false
      }
      return data
    }))
    const quickest = await Promise.race(promises)
    if(!quickest){
      return {
        quickest:((await promises[0]) || (await promises[1])),
        promises
      }
    }
    return {
      quickest,
      promises
    }
  }
  /**
   * Gets channel data from websocket or cache, whichever is fastest
   */
  async function getChannelData(){
    if(typeof worker==="undefined"){
      worker = new PromiseWorker(new Worker("/scripts/worker.js"))
      console.log("Worker was not initalized.")
      console.log("Worker is now a(n)",typeof worker)
    }
    const promises = []
    promises.push(worker.postMessage({
      type:"getChannels",
    }).then(data=>{
      console.log("Load channels from Indexeddb")
      if(!data.length){
        //IndexedDB is empty, perhaps is first page load
        return false
      }
      return data
    }))
    if(typeof conn!="undefined"&&conn.connected){
      //Connected before page load
      promises.push(new Promise((resolve,reject)=>{
        conn.emit("channelDataReq",{},function(err,data){
          //Always check if error occurred
          if(err) throw err;
          //Put channel data into client-side database for caching and offline access
          worker.postMessage({
            type:"setChannels",
            data
          })
          //Add to localstorage as a fallback
          localStorage.setItem("channelData",JSON.stringify(data))
          console.log("Load channels from websocket")
          resolve(data)
        })
      }))
    }
    const quickest = await Promise.race(promises)
    if(!quickest){
      return {
        quickest:((await promises[0]) || (await promises[1])),
        promises
      }
    }
    return {
      quickest,
      promises
    }
  }
  return {
    getHomework,
    getChannelData
  }
})()