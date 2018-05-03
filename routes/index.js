const express = require('express');
const Sugar = require("sugar-date")
const router = express.Router();
const db = require("../database")
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
router.get('/', (req, res, next) => {
  res.header("Link",parsePushHeaders(pushFiles))
  db.getHomework().then(function(data){
    res.render('index', { title: 'Express',data,Sugar,sortType:"Due date",sortOrder:0});
  })
});
module.exports = router;
