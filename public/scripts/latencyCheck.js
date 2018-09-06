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
        if(name.id!==id){
          throw new Error("Id mismatch")
        }
        //Get channels
        start = performance.now()
        conn.emit("channelDataReq",{},_=>{
          latency.database = (performance.now()-start).toFixed(2)
          resolve({latency})
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
  const browser = (function(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
  })()
  const {platform} = navigator
  const release = hwboardRelease
  const storageUsage = await navigator.storage.estimate()
  if(navigator.doNotTrack){
    return {storageUsage,release}
  }
  return {
    idBase64,
    browser,
    platform,
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