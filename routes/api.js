const express = require('express');
const router = express.Router();
const db = require("../controllers");
const EventEmitter = require('events');
const auth = require("../auth");
let io;

class socketIO extends EventEmitter {}

router.post("/api/:method",(req, res) => {
  console.log("Loaded API route")
  ;(async ()=>{
    if(!io){
      io = require("../app").io;
    }
    const socket = new socketIO();
    const {method} = req.params;

    //Handle uncaught errors
    socket.on("uncaughtError",err=>{
      let code;
      if(err.toString().includes("Please check if the homework you want to")){
        code = 409;
        console.log({err});
      }else{
        code = err.code || 500;
      }
      res.status(code).end(err.toString().replace("Error: ",""));
    });

    try{
      if(db.getNumTables()===0){
        await db.init();
      }
      const token = req.signedCookies.token;
      const tokenClaims = await auth.verifyToken(token);
      socket.userData = tokenClaims;
    }catch(e){
      console.log(e);
      //Problem with token, perhaps spoofed token?
      //Anyway get rid of this socket
      console.log("Forced disconnect");
      return res.status(403).end("Auth error");
    }
    //Administration
    require("../websocket-routes/admin")(socket,io,db);

    //Homework ops
    require("../websocket-routes/homework")(socket,io,db);

    //Stats
    require("../websocket-routes/analytics")(socket,db);

    //For tests
    require("../websocket-routes/tests")(socket);

    //Supported methods
    const methods = [

      //Testing
      "whoami",
      "textMessage",

      //Homework
      "dataReq",
      "editReq",
      "deleteReq",
      "addReq",

      //Analytics
      "homeworkSubjectData",
      "homeworkDayData",

      //Administration and channels
      "channelDataReq",
      
      //Most destructive admin methods are not supported as of now
      "addMember",
    ];
    if(methods.includes(method)){
      socket.emit(method,req.body,function(err,...results){
        if(err){
          throw err;
        }
        return res.end(JSON.stringify(results));
      });
    }else{
      return res.status(400).end("Invalid method");
    }
  })()
    .catch(err=>{
      let code;
      if(err.toString().includes("Please check if the homework you want to")){
        code = 409;
        console.log({err});
      }else{
        code = err.code || 500;
      }
      res.status(code).end(err.toString().replace("Error: ",""));
    });
});

module.exports = router;