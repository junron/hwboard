const latencyCheck = ()=>{
  const latency = {
    normal:0,
    resolve:0,
    database:0,
  }
  return new Promise((resolve,_)=>{
    let start = performance.now()
    //Tests basic ping
    conn.emit("whoami",null,(_,email)=>{
      latency.normal = (performance.now()-start).toFixed(2)
      //Resolve student id to name
      const id = email.replace("@nushigh.edu.sg","")
      start = performance.now()
      conn.emit("studentDataReq",{
        method:"getStudentById",
        data:id
      },(_,name)=>{
        latency.resolve = (performance.now()-start).toFixed(2)
        if(name && name.id!==id){
          throw new Error("Id mismatch")
        }
        //Get channels
        start = performance.now()
        conn.emit("channelDataReq",{},_=>{
          latency.database = (performance.now()-start).toFixed(2)
          conn.emit("getHostName",hostname=>{
            latency.nodeId = hostname
            resolve({latency})
          })
        })
      })
    })
  })
}
const sendResults = async data=>{
  return fetch("https://latency-check.nushhwboard.tk/api/appendData",{
    method:"POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    mode:"no-cors",
    body:JSON.stringify(data)
  })
}

const getStats = async _=>{
  const idBytes = await crypto.subtle.digest("SHA-512",new TextEncoder("utf-8").encode(getCookie("name")+getCookie("email")))
  const idBase64 = btoa(new Uint8Array(idBytes).reduce((data, byte) => data + String.fromCharCode(byte), ''))
  const release = (await (await fetch("/cd/version.json?useCache")).json()).commitSha
  let storageUsage = "Not supported"
  //Navigator.storage.estimate not supporte in Safari and Opera
  try{
    if(navigator.storage && typeof navigator.storage.estimate==="function"){
      storageUsage = await navigator.storage.estimate()
    }
  }catch(e){
    console.log(e)
  }
  return {
    idBase64,
    storageUsage,
    release
  }
}

;(async _=>{
  async function startCheck(){
    const results = await Promise.all([latencyCheck(),getStats()])
    const data = Object.assign(...results)
    return sendResults(data)
  }
  conn.emit("isReady",null,value=>{
    if(value){
      console.log("run")
      startCheck()
    }else{
      console.log("deferred")
      conn.on("ready",startCheck)
    }
  })
})()
