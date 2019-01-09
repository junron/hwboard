const express = require('express');
const router = express.Router();

const {COOKIE_SECRET:password} = require("../loadConfig");
const {timingSafeEqual} = require("crypto");

//Switch user to access hwboard as another user
//Requires knowledge of cookie secret
//For testing and debugging ONLY
const bufferPassword = Buffer.from(password,"utf-8");
router.get("/testing/su",(req, res) => {
  (async ()=>{
    res.set('Content-Type','text/plain');
    const ip = req.connection.remoteAddress;
    const {userPassword,switchUserName} = req.query;
    const bufferUserPassword = Buffer.from(userPassword.split(" ").join("+"),"utf-8");
    //Use timing secure to prevent timing attacks
    if(bufferPassword.length===bufferUserPassword.length && timingSafeEqual(bufferPassword,bufferUserPassword)){
      console.log(`Successful su from ${ip} for ${switchUserName}`);
      res.cookie("username",switchUserName,{
        secure:true,
        signed:true,
        httpOnly:true,
        sameSite:"lax"
      });
      res.cookie("email", switchUserName, {
        secure:true,
        httpOnly:true,
        sameSite:"lax"
      });
      res.end(`Successful su from ${ip} for ${switchUserName}`);
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
