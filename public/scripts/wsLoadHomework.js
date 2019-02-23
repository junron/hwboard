//Db is init and user is authed
conn.on("ready",loadHomework);

//Server pushes data, re-render
conn.on("data",({channel,data:channelData})=>{
  //Add data to client side db
  console.log("Data is pushed from server");
  updateChannelHomework(channel,channelData).then(newData=>{
    reRender(newData).then(()=>{
      $(".swipeout-actions-left").css("visibility","visible");
      $(".swipeout-actions-right").css("visibility","visible");
    });
  });
});

conn.on("channelData",data=>{
  setSubjectVariables([data[Object.keys(data)[0]]],true);
});