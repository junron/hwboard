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
  while(!subjectChannelMappissng){
    //Wait for channelData to be loaded
  }
  reRender(data)
})

worker.postMessage({
  type:"getChannels",
}).then(data=>{
  console.log("Load channels from Indexeddb")
  if(!data.length){
    //IndexedDB is empty, perhaps is first page load
    return
  }
  setSubjectVariables(data)
})

if(typeof conn!="undefined"){
  //Connected before page load
  conn.emit("isReady",null,loadHomework)
}