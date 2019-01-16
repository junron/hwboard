const express = require('express');
const router = express.Router();

const {COOKIE_SECRET:password} = require("../loadConfig");
const {timingSafeEqual} = require("crypto");
const studentApi = require("../students");

//Switch user to access hwboard as another user
//Requires knowledge of cookie secret
//For testing and debugging ONLY
const bufferPassword = Buffer.from(password,"utf-8");
router.get("/testing/su",(req, res) => {
  (async ()=>{
    res.set('Content-Type','text/plain');
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const {userPassword,switchUserName} = req.query;
    if(!userPassword){
      res.status(403).end(`Failed su from ${ip} for ${switchUserName}`);
      return;
    }
    const bufferUserPassword = Buffer.from(userPassword.split(" ").join("+"),"utf-8");
    //Use timing secure to prevent timing attacks
    if(bufferPassword.length===bufferUserPassword.length && timingSafeEqual(bufferPassword,bufferUserPassword)){
      let name = "Unknown";
      try{
        ({name} = await studentApi.getStudentById(switchUserName.replace("@nushigh.edu.sg","")));
      }catch(_){
        console.log("Student not found");
      }
      console.log(`Successful su from ${ip} for ${name} (${switchUserName})`);
      res.cookie("username",switchUserName,{
        secure:true,
        signed:true,
        httpOnly:true,
        sameSite:"lax"
      });
      res.cookie("email", switchUserName, {
        secure:true,
        sameSite:"lax"
      });
      res.cookie("name", name.toUpperCase(), {
        secure:true,
        sameSite:"lax"
      });
      res.end(`Successful su from ${ip} for ${name} (${switchUserName})`);
    }else{
      console.log(`Failed su from ${ip} for ${switchUserName}`);
      res.status(403).end(`Failed su from ${ip} for ${switchUserName}`);
    }
  })()
    .catch((e)=>{
      res.status(500).end(e.toString());
      console.log(e);
    });
});

module.exports = router;
