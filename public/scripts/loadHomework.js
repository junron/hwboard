//Turns channel data into variables
function setSubjectVariables(channelData){
  timetable = {}
  subjectChannelMapping = {}
  subjectSelectionList = []
  for(const channelName in channelData){
    const channel = channelData[channelName]
    timetable = Object.assign(timetable,channel.timetable)
    //User is admin or higher of channel
    if(channel.permissions>=2){
      for (const subject of channel.subjects){
        subjectSelectionList.push(subject)
        subjectChannelMapping[subject] = channel.name
      }
    }
  }
}

channelSettings = {
  channel,
  removeExpired:true
}

//Load cached data before websocket connects
//Allows for faster loading of updated data
async function loadHomeworkFromCache(){
  const promises = []
  promises.push(worker.postMessage({
    type:"getChannels",
  }).then(data=>{
    console.log("Load channels from Indexeddb")
    if(!data.length){
      //IndexedDB is empty, perhaps is first page load
      return false
    }
    setSubjectVariables(data)
    return true
  }))

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
      return []
    }
    return data
  }))
  const [data,channelResult] = await Promise.all(promises)
  if(data.length&&channelResult){
    reRender(data)
  }
}

loadHomeworkFromCache()

if(typeof conn!="undefined"){
  //Connected before page load
  conn.emit("isReady",null,loadHomework)
}

async function loadChannelData(){
  const promises = []
  promises.push(worker.postMessage({
    type:"getChannels",
  }).then(data=>{
    console.log("Load channels from Indexeddb")
    if(!data.length){
      //IndexedDB is empty, perhaps is first page load
      return false
    }
    setSubjectVariables(data)
    return true
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
        setSubjectVariables(data)
        console.log("Load channels from websocket")
        resolve(true)
      })
    }))
  }
  return Promise.race(promises)
}