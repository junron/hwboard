const express = require('express');
const router = express.Router();
const {getNumTables} = require("../controllers");
router.get("/cd/info",(_, res) => {
  (async ()=>{
    res.set('Content-Type','text/plain');
    let hostName;
    if(process.env.IS_DOCKER){
      hostName = process.env.HOSTNAME;
    }else{
      hostName = "Unauthorized";
    }
    const numTables = await getNumTables();
    if(numTables===0){
      return res.status(500).end("No channels");
    }
    res.end(`
    Machine name: ${hostName}
    Channels: ${numTables}
    `);
  })()
    .catch((e)=>{
      const code = e.code || 500;
      res.status(code).end(e.toString());
      console.log(e);
    });
});

module.exports = router;
