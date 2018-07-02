'use strict'
const path = require("path")
const express = require('express');
const request = require("request-promise-native")
const renderer = require('../public/scripts/renderer')
const Sugar = require("sugar-date")
let dbInit = false
const router = express.Router();
const db = require("../database")
const auth = require("../auth")
const config = require("../loadConfig")
const {MS_CLIENTID:clientId,MS_CLIENTSECRET:clientSecret,HOSTNAME:hostname,CI:testing,REPORT_ERRORS:reportErrors} = config
//Files to HTTP2 push for quicker page loading
//TODO: find a library to auto push required files
 
//Server config
//@caddy users:
//caddy automatically pushes
//https://caddyserver.com/docs/push

//@nginx users
//add http2 directive
//And add `http2_push_preload on;` within location block
const basePushFiles = [
  "/styles/roboto.css",
  "/styles/icons.css",
  "/fonts/material.ttf",
  "/fonts/KFOlCnqEu92Fr1MmSU5fBBc9.ttf",
  "/fonts/KFOmCnqEu92Fr1Mu4mxP.ttf",
  "/scripts/app.js",
  "/scripts/socket.io.js",
  "/framework7/css/framework7.css",
  "/framework7/js/framework7.js",
]
const pushFiles = [
  "/styles/roboto.css",
  "/styles/icons.css",
  "/scripts/socket.io.js",
  "/framework7/css/framework7.css",
  "/framework7/js/framework7.js",
  "/scripts/promise-worker.js",
  "/scripts/jquery.min.js",
  "/scripts/app.js",
  "/scripts/generalForms.js",
  "/scripts/worker.js",
  "/scripts/dexie.min.js",
  "/scripts/promise-worker.register.js",
  "/fonts/material.ttf",
  "/fonts/KFOlCnqEu92Fr1MmSU5fBBc9.ttf",
  "/fonts/KFOmCnqEu92Fr1Mu4mxP.ttf"

]
function isMobile(userAgent){
  return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i
  .test(userAgent.substr(0,4)))
}
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

//View channel 
router.get('/:channel', async (req, res, next) => {
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  const channelName = req.params.channel
  const authData = await authChannels(req,res)
  if(authData=="redirected"){
    return
  }
  const {channelData} = authData
  const channel = channelData[channelName]
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

    let timetable = {}
    for(const channelName in channelData){
      const channel = channelData[channelName]
      timetable = Object.assign(timetable,channel.timetable)
    }

    //Report errors in production or mobile
    const mobile = isMobile(req.headers['user-agent'])
    res.render('index', {renderer,data,sortType,sortOrder,admin,adminChannels,timetable,reportErrors:(reportErrors||mobile)})
  }else{
    res.status(404).end("Channel not found")
  }
})


//View channel settings
router.get('/:channel/settings', async (req, res, next) => {
  if(testing && req.cookies.username){
    const email = req.cookies.username
    res.cookie("username",email,{
      signed:true,
      httpOnly:true
    })
  }
  if(!dbInit){
    //Create tables and stuffs
    await db.init()
    dbInit = true
  }
  const channelName = req.params.channel
  const authData = await authChannels(req,res)
  if(authData=="redirected"){
    return
  }
  const {channelData,decodedToken} = authData
  // console.log({channelData})
  const channel = channelData[channelName]
  if(channel){
    res.header("Link",parsePushHeaders(basePushFiles))
    const email = decodedToken.preferred_username
    //Report errors in production or mobile
    const mobile = isMobile(req.headers['user-agent'])
    const root = channel.roots.includes(email)
    res.render('channelSettings', {root,reportErrors:(reportErrors||mobile)})
  }else{
    res.status(404).end("Channel not found")
  }
})


/* GET home page. */
router.get('/', async (req, res, next) => {

  if(!dbInit){
    //Create tables and stuffs
    console.log("inited")
    await db.init()
    dbInit = true
  }
  const authData = await authChannels(req,res)
  if(authData=="redirected"){
    return
  }
  if(req.query.code && req.signedCookies.redirPath){
    return res.redirect(req.signedCookies.redirPath)
  }
  const {channelData, adminChannels} = authData
  // console.log(channelData)
  //Check if user is admin in any channel
  //This prevents us from sending the add homework form unnecessarily
  const admin = Object.keys(adminChannels).length > 0 || testing
  //Get sort options
  let {sortOrder,sortType} = req.cookies
  if(sortOrder){
    sortOrder = parseInt(sortOrder)
  }
  //Server push
  res.header("Link",parsePushHeaders(pushFiles))

  //Get homework for rendering
  let data = await db.getHomeworkAll(channelData)

  //Report errors in production or mobile
  const mobile = isMobile(req.headers['user-agent'])
  let timetable = {}
  for(const channelName in channelData){
    const channel = channelData[channelName]
    timetable = Object.assign(timetable,channel.timetable)
  }
  res.render('index', {renderer,data,sortType,sortOrder,admin,adminChannels,timetable,reportErrors:(reportErrors||mobile)})
});


//Authenticate user and get authorised channels
async function authChannels(req,res){
  let decodedToken
  //If in testing mode, bypass authentication
  //See testing.md
  if(testing){
    console.log(req.signedCookies)
    const email = req.signedCookies.username || "tester@nushigh.edu.sg"
    decodedToken = {
      name:"tester",
      preferred_username:email
    }
  }else{
    //Check auth here
    //Temp var to store fresh token
    let tempToken 
      //Check if token stored in cookie, 
    //if not, generate new token
    // console.log(req.signedCookies,"signed cookies")
    // console.log(req.signedCookies,"signed cookies")
    // console.log(req.cookies)
    if(!(req.signedCookies && req.signedCookies.token)){

      //Check if authorization code is present
      //Auth codes can be exchanged for id_tokens
      const scopes = ["user.read","openid","profile"]
      res.cookie("redirPath",req.url,{
        maxAge:10*60*60*1000,
        signed:true,
      })
      if(!(req.query&&req.query.code)){
          console.log("redirected")
          res.redirect("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"+
          "response_type=code&"+
          `scope=https%3A%2F%2Fgraph.microsoft.com%2F${scopes.join("%20")}&`+
          `client_id=${clientId}&`+
          `redirect_uri=https://${hostname}/&`+
          "prompt=select_account&"+
          `response_mode=query`)
          return "redirected"
      }else{
        //Get id_token from auth code
        const code = req.query.code
        const options = {
            method:"POST",
            uri:"https://login.microsoftonline.com/common/oauth2/v2.0/token",
          formData:{
            //grant_type:"id_token",
            grant_type:"authorization_code",
            scope:`https://graph.microsoft.com/${scopes.join(" ")}`,
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
            signed:true,
            maxAge:2592000000
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
    res.cookie('email',decodedToken.preferred_username)
  }

  //Get authorised channels
  const channelData = {}
  const channels = await db.getUserChannels(decodedToken.preferred_username)
  for (let channel of channels){
    channelData[channel.name] = channel
  }
  //Yey my failed attempt at functional programming
  const adminChannels =
  channels
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
