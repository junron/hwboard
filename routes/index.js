'use strict'
const express = require('express');
const renderer = require('../public/scripts/renderer')
const Sugar = require("sugar-date")
const router = express.Router();
const db = require("../database")
const auth = require("../auth")
//Files to HTTP2 push for quicker page loading
//TODO: find a library to auto push required files

//Server config
//@caddy users:
//caddy automatically pushes
//https://caddyserver.com/docs/push

//@nginx users
//https://www.nginx.com/blog/nginx-1-13-9-http2-server-push/
const pushFiles = [
  "/styles/roboto.css",
  "/styles/icons.css",
  "/scripts/socket.io.js",
  "/styles/material-components-web.min.css"
]
function parsePushHeaders(files){
  let headers=""
  for (let file of files){
    let type
    if(file.includes(".css")){
      type = "style"
    }else if(file.includes(".js")){
      type = "script"
    }else if(file.includes(".ttf")){
      type = "font"
    }
    headers+=`<${file}>; rel=preload; as=${type},`
  }
  return headers
}

/* GET home page. */
router.get('/', async (req, res, next) => {
  //Check auth here
  if(!req.cookies.token){
    const hostname = process.env.HOSTNAME
    const clientID = process.env.MS_CLIENTID
    return res.render("auth",{hostname,clientID})
  }
  const token = req.cookies.token
  res.clearCookie("token")
  res.cookie("token",token,{
    httpOnly:true,
    secure:true
  })

  //TODO actually check for admin
  let admin = true
  if(req.cookies.admin=="false"){
    admin = false
  }

  const decodedToken = await auth.verifyToken(token)
  if(!decodedToken.preferred_username.includes("nushigh.edu.sg")){
    throw new Error("You must log in with a NUSH email.")
  }
  //Get sort options
  let {sortOrder,sortType} = req.cookies
  if(sortOrder){
    sortOrder = parseInt(sortOrder)
  }
  //Server push
  res.header("Link",parsePushHeaders(pushFiles))

  //Get homework for rendering
  let data = await db.getHomework()
  
  res.render('index', {renderer,data,sortType,sortOrder,admin})
});
module.exports = router;
