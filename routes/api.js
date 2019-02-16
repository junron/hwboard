const express = require('express');
const router = express.Router();
const db = require("../controllers");
const EventEmitter = require('events');
const auth = require("../auth");
const {timingSecureEquals} = require("crypto");

let io;
const {ALLOW_REPLICATION_WITH_PASSWORD:repPass} = require("../loadConfig");

class socketIO extends EventEmitter {}

router.post("/api/:method",(req, res, next) => {
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
      if(repPass){
        const providedPassword = req.params.replication ? req.params.replication.password : "";
        if(providedPassword.length===repPass.length){
          if(timingSecureEquals(Buffer.from(providedPassword),Buffer.from(repPass))){
            socket.userData = {
              name:"replication_user",
              preferred_username:req.params.replication.user || "repuser@nushigh.edu.sg"
            };
          }else{
            throw new Error("Replication password incorrect");
          }
        }else{
          throw new Error("Replication password incorrect");
        }
      }else{
        const token = req.signedCookies.token;
        const tokenClaims = await auth.verifyToken(token);
        socket.userData = tokenClaims;
      }
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

    const specialMethods = [
      "setChannelData",
      "setHomeworkData"
    ];
    const replicationMethods = [
      "addChannel",
    ].concat(specialMethods);
    
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
    ].push(...(socket.userData.name === "rep_user" ? replicationMethods : []));
    if(methods.includes(method)){
      socket.emit(method,req.body,function(err,...results){
        if(err){
          throw err;
        }
        return res.end(JSON.stringify(results));
      });
    }else{
      return next();
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