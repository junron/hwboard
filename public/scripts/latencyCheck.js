const latencyCheck = ()=>{
  const latency = {
    normal:0,
    resolve:0,
    database:0,
  };
  return new Promise(resolve=>{
    let start = performance.now();
    //Tests basic ping
    conn.emit("whoami",null,(_,email)=>{
      latency.normal = (performance.now()-start).toFixed(2);
      //Resolve student id to name
      const id = email.replace("@nushigh.edu.sg","");
      start = performance.now();
      conn.emit("studentDataReq",{
        method:"getStudentById",
        data:id
      },(_,name)=>{
        latency.resolve = (performance.now()-start).toFixed(2);
        if(name && name.id!==id){
          throw new Error("Id mismatch");
        }
        //Get channels
        start = performance.now();
        conn.emit("channelDataReq",{},()=>{
          latency.database = (performance.now()-start).toFixed(2);
          conn.emit("getHostName",hostname=>{
            latency.nodeId = hostname;
            resolve({latency});
          });
        });
      });
    });
  });
};
const sendResults = async data=>{
  return fetch("https://latency-check.nushhwboard.tk/api/appendData",{
    method:"POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    mode:"no-cors",
    body:JSON.stringify(data)
  });
};

const getStats = async ()=>{
  const release = (await (await fetch("/cd/version.json?useCache")).json()).commitSha;
  if(location.origin==="https://beta.nushhwboard.tk"){
    Framework7App.loadModules(["toast"]).then(()=>{
      Framework7App.toast.show({
        text:`Hwboard beta version ${JSON.stringify(release).slice(1,9)}`,
        closeTimeout:3000
      });
    });
  }
  let storageUsage = "Not supported";
  //Navigator.storage.estimate not supported in Safari and Opera
  try{
    if(navigator.storage && typeof navigator.storage.estimate==="function"){
      storageUsage = await navigator.storage.estimate();
    }
  }catch(e){
    console.log(e);
  }
  return {
    id:getCookie("name"),
    storageUsage,
    release
  };
}

;(async ()=>{
  async function startCheck(){
    const results = await Promise.all([latencyCheck(),getStats()]);
    const data = Object.assign(...results);
    return sendResults(data);
  }
  conn.emit("isReady",null,value=>{
    if(value){
      console.log("run");
      startCheck();
    }else{
      console.log("deferred");
      conn.on("ready",startCheck);
    }
  });
})();
