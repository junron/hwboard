const express = require('express')
const router = express.Router()

const {COOKIE_SECRET:password} = require("../loadConfig")
const {timingSafeEqual} = require("crypto")

//Switch user to access hwboard as another user
//Requires knowledge of cookie secret
//For testing and debugging ONLY
const bufferPassword = new Buffer(password)
router.get("/testing/su",(req, res) => {
  ;(async ()=>{
    const ip = req.connection.remoteAddress
    const {userPassword,switchUserName} = req.query
    const bufferUserPassword = new Buffer(userPassword.split(" ").join("+"))
    //Use timing secure to prevent timing attacks
    if(bufferPassword.length==bufferUserPassword.length && timingSafeEqual(bufferPassword,bufferUserPassword)){
      console.log(`Successful su from ${ip} for ${switchUserName}`)
      res.cookie("username",switchUserName,{
        secure:true,
        signed:true,
        httpOnly:true
      })
      res.end(`Successful su from ${ip} for ${switchUserName}`)
    }else{
      console.log(`Failed su from ${ip} for ${switchUserName}`)
      res.status(403).end(`Failed su from ${ip} for ${switchUserName}`)
    }
  })()
  .catch((e)=>{
    res.status(500).end(e.toString())
    console.log(e)
  })
})

module.exports = router
