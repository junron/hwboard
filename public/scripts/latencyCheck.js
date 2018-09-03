const latencyCheck = ()=>{
  const results = {
    normal:0,
    resolve:0,
    database:0,
  }
  return new Promise((resolve,reject)=>{
    let start = performance.now()
    //Tests basic ping
    conn.emit("whoami",null,(_,email)=>{
      results.normal = performance.now()-start
      //Resolve student id to name
      const id = email.replace("@nushigh.edu.sg","")
      start = performance.now()
      conn.emit("studentDataReq",{
        method:"getStudentById",
        data:id
      },(_,name)=>{
        results.resolve = performance.now()-start
        if(name.id!==id){
          throw new Error("Id mismatch")
        }
        //Get channels
        start = performance.now()
        conn.emit("channelDataReq",{},_=>{
          results.database = performance.now()-start
          resolve(results)
        })
      })
    })
  })
}