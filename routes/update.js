const {promisify} = require('util');
function promisifyAll(moduleObj) {
  for(const thing in moduleObj){
    if(typeof moduleObj[thing]==="function"){
      moduleObj[thing] = promisify(moduleObj[thing]);
    }
  }
  return moduleObj;
}

const express = require('express');
const router = express.Router();
const simpleGit = promisifyAll(require('simple-git')());
const pm2 = promisifyAll(require("pm2"));
const {resolve} = require("path");

const {GITLAB_SECRET_TOKEN:gitlabToken} = require("../loadConfig");
const {timingSafeEqual} = require("crypto");

 
async function auth(req){
  if(!gitlabToken){
    return;
  }
  const bufferToken = Buffer.from(gitlabToken,"utf-8");
  const {headers} = req;
  if(!headers["x-gitlab-token"]){
    const error = new Error("Gitlab token missing");
    error.code = 403;
    throw error;
  }
  const bufferUserToken = Buffer.from(headers["x-gitlab-token"],"utf-8");
  //Use timing secure to prevent timing attacks
  if(bufferToken.length==bufferUserToken.length && timingSafeEqual(bufferToken,bufferUserToken)){
    return;
  }else{
    const error = new Error("Gitlab token invalid");
    error.code = 403;
    throw error;
  }
}
router.get("/cd/update",(req, res) => {
  (async ()=>{
    const {commitSHA} = req.query;
    const rename = promisify(require("fs").rename);
    pm2.connect = promisify(pm2.connect);
    const promiseArr = [simpleGit.revparse(["--abbrev-ref","HEAD"]),auth(req),simpleGit.fetch(),pm2.connect()];
    let [branch] = await Promise.all(promiseArr);
    branch = branch.trim();
    await rename(resolve(__dirname,"../.env"),resolve(__dirname,"../../.env"));
    await simpleGit.reset(["--hard",commitSHA]);
    await rename(resolve(__dirname,"../../.env"),resolve(__dirname,"../.env"));
    res.end(`
    Resetting branch ${branch}
    To commit ${commitSHA}
    `);
    await pm2.reload("hwboard2-web");
    await pm2.disconnect();
    console.log("Done");
  })()
    .catch((e)=>{
      console.log(e);
      const code = e.code || 500;
      res.status(code).end(e.toString());
    });
});

module.exports = router;
