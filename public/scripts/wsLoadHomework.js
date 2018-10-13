//Db is init and user is authed
conn.on("ready",loadHomework);

//Server pushes data, re-render
conn.on("data",({channel,data:channelData})=>{
  //Add data to client side db
  console.log(channel,channelData)
  console.log("Data is pushed from server")
  updateChannelHomework(channel,channelData).then(newData=>{
    reRender(newData).then(()=>{
      $(".swipeout-actions-left").css("visibility","visible");
      $(".swipeout-actions-right").css("visibility","visible");
    })
  })
});

conn.on("channelData",_=>{
  conn.emit("channelDataReq",{},setSubjectVariables)
})