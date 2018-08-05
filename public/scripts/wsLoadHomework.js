//request homework data from server
//syntax conn.emit(<eventName>,[<data>],[<callback>])
//Db is init and user is authed
conn.on("ready",loadHomework)

function loadHomework(){
  conn.emit("dataReq",channelSettings,function(err,data){
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
    reRender(data)
  })
}
//Server pushes data, re-render
conn.on("data",({channel,data:channelData})=>{
  //Add data to client side db
  console.log(channel,channelData)
  updateChannelHomework(channel,channelData).then(newData=>{
    reRender(newData)
  })
})