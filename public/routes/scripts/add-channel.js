document.getElementById("add-channel").addEventListener("click",()=>{
  const input = document.getElementById("channelName").value;
  if(input.trim().length==0){
    return Framework7App.dialog.alert("Channel name cannot be empty");
  }
  conn.emit("addChannel",input.trim(),(err,channelName)=>{
    if(err){
      Framework7App.loadModules(['dialog']).then(()=>{
        Framework7App.dialog.alert(err);
      });
      throw err;
    }
    document.getElementById("status").innerHTML = `
    The channel ${channelName} has been created.
    Add subjects and members <a href="/channels/${channelName}/settings">here</a>
    `;
  });
});

conn.on("disconnect",()=>{
  if(location.hash.includes("addChannel")){
    conn.connect();
  }
});