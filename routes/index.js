'use strict'
const express = require('express');
const request = require("request-promise-native")
const renderer = require('../public/scripts/renderer')
const Sugar = require("sugar-date")
let dbInit = false
const router = express.Router();
const db = require("../database")
const auth = require("../auth")
const config = require("../loadConfig")
const {MS_CLIENTID:clientId,MS_CLIENTSECRET:clientSecret,HOSTNAME:hostname,CI:testing} = config
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
router.get("/experiments/:experiment_name",async (req,res,next)=>{
  if(req.params.experiment_name.includes(".js")){
    return next()
  }
  const {channelData, adminChannels} = await authChannels(req,res)
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  //Check if user is admin in any channel
  //This prevents us from sending the add hoemwrok form unnecessarily
  const admin = Object.keys(adminChannels).length > 0
  //Get sort options
  let {sortOrder,sortType} = req.cookies
  if(sortOrder){
    sortOrder = parseInt(sortOrder)
  }
  //Server push
  res.header("Link",parsePushHeaders(pushFiles))

  //Get homework for rendering
  let data = await db.getHomeworkAll(channelData)
  res.render("experiments/"+req.params.experiment_name,{renderer,data,sortType,sortOrder,admin,adminChannels})
})

//View channel 
router.get('/:channel', async (req, res, next) => {
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  const channelName = req.params.channel
  const {channelData} = await authChannels(req,res)
  const channel = channelData.find(channel=>{
    return channel.name == channelName
  })
  if(channel){
    let {sortOrder,sortType} = req.cookies
    if(sortOrder){
      sortOrder = parseInt(sortOrder)
    }
    res.header("Link",parsePushHeaders(pushFiles))
    const data = await db.getHomework(channelName)
    const adminChannels = 
    [channel]
    .filter(channel=>
      //Get admin permissions only
      channel.permissions>=2
    )
    .reduce((subjects,channel)=>{
      //Create object with channel names as keys and subject array as values
      subjects[channel.name] = channel.subjects
      return subjects
    },{})
    const admin = Object.keys(adminChannels).length > 0

    res.render('index', {renderer,data,sortType,sortOrder,admin,adminChannels})
  }else{
    res.status(404).end("Channel not found")
  }
})


//View channel settings
router.get('/:channel/settings', async (req, res, next) => {
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  const channelName = req.params.channel
  const {channelData,decodedToken} = await authChannels(req,res)
  const channel = channelData.find(channel=>{
    return channel.name == channelName
  })
  if(channel){
    res.header("Link",parsePushHeaders(pushFiles))
    const email = decodedToken.preferred_username
    res.render('channelSettings', {channel,email})
  }else{
    res.status(404).end("Channel not found")
  }
})


/* GET home page. */
router.get('/', async (req, res, next) => {
  const {channelData, adminChannels} = await authChannels(req,res)
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  //Check if user is admin in any channel
  //This prevents us from sending the add hoemwrok form unnecessarily
  const admin = Object.keys(adminChannels).length > 0
  //Get sort options
  let {sortOrder,sortType} = req.cookies
  if(sortOrder){
    sortOrder = parseInt(sortOrder)
  }
  //Server push
  res.header("Link",parsePushHeaders(pushFiles))

  //Get homework for rendering
  let data = await db.getHomeworkAll(channelData)
  res.render('index', {renderer,data,sortType,sortOrder,admin,adminChannels})
});



//Authenticate user and get authorised channels
async function authChannels(req,res){
  let decodedToken
  //If in testing mode, bypass authentication
  //See testing.md
  if(testing){
    decodedToken = {
      name:"tester",
      preferred_username:"tester@nushigh.edu.sg"
    }
  }else{
    //Check auth here
    //Temp var to store fresh token
    let tempToken 
    //Check if token stored in cookie, 
    //if not, generate new token
    if(!req.signedCookies.token){
      //Check if authorization code is present
      //Auth codes can be exchanged for id_tokens
      if(!req.query.code){
        return res.redirect("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"+
        "response_type=code&"+
        "scope=https%3A%2F%2Fgraph.microsoft.com%2Fuser.read%20openid%20profile&"+
        `client_id=${clientId}&`+
        `redirect_uri=https://${hostname}/&`+
        "prompt=select_account&"+
        `response_mode=query`)
      }else{
        //Get id_token from auth code
        const code = req.query.code
        const options = {
            method:"POST",
            uri:"https://login.microsoftonline.com/common/oauth2/v2.0/token",
          formData:{
            //grant_type:"id_token",
            grant_type:"authorization_code",
            scope:"https://graph.microsoft.com/user.read openid profile",
            client_id:clientId,
            redirect_uri:"https://"+hostname+"/",
            code,
            client_secret:clientSecret
          }
        }
        try{
          const data = JSON.parse(await request(options))
          //Store token in cookie for easier login later
          //httpOnly, can be trusted
          res.cookie("token",data.id_token,{
            httpOnly:true,
            secure:true,
            signed:true
          })
          tempToken = data.id_token
        }catch(e){
          console.log(e)
        }
      }
    }
    const token = req.signedCookies.token || tempToken
    //Verify token (check signature and decode)
    decodedToken = await auth.verifyToken(token)
    if(!decodedToken.preferred_username.includes("nushigh.edu.sg")){
      throw new Error("You must log in with a NUSH email.")
    }
    //Stored decoded signed token data in a cookie for future client-side use
    //Perhaps for offline rendering
    //Accessible via client side JS, so DO NOT trust!!!
    res.cookie('decodedToken', decodedToken, {signed: true,secure:true})
  }

  //Get authorised channels
  const channelData = await db.getUserChannels(decodedToken.preferred_username)
  //Yey my failed attempt at functional programming
  const adminChannels =
  channelData
  .filter(channel=>
    //Only users with at least admin permissions can edit homework
    channel.permissions>=2
  )
  .reduce((subjects,channel)=>{
    //Create object with channel names as keys and subject array as values
    subjects[channel.name] = channel.subjects
    return subjects
  },{})
  return {
    channelData,
    adminChannels,
    decodedToken
  }
}
module.exports = router;
