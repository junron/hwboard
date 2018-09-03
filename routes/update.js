const express = require('express')
const router = express.Router()
const simpleGit = require('simple-git')()
const {promisify} = require("util")
const pm2 = require("pm2")
const {connect,disconnect,reload} = pm2
const {fetch,revparse,reset} = simpleGit

simpleGit.fetch = promisify(fetch)
simpleGit.revparse = promisify(revparse)
simpleGit.reset = promisify(reset)
pm2.connect = promisify(connect)
pm2.disconnect = promisify(disconnect)
pm2.reload = promisify(reload)

const {GITLAB_SECRET_TOKEN:gitlabToken} = require("../loadConfig")
const {timingSafeEqual} = require("crypto")

 
async function auth(req){
  if(!gitlabToken){
    return
  }
  const bufferToken = Buffer.from(gitlabToken,"utf-8")
  const {headers} = req
  if(!headers["x-gitlab-token"]){
    const error = new Error("Gitlab token missing")
    error.code = 403
    throw error
  }
  const bufferUserToken = Buffer.from(headers["x-gitlab-token"],"utf-8")
  //Use timing secure to prevent timing attacks
  if(bufferToken.length==bufferUserToken.length && timingSafeEqual(bufferToken,bufferUserToken)){
    return
  }else{
    const error = new Error("Gitlab token invalid")
    error.code = 403
    throw error
  }
}
router.get("/cd/update",(req, res) => {
  ;(async ()=>{
    const {commitSHA} = req.query
    const promiseArr = [simpleGit.revparse(["--abbrev-ref","HEAD"]),auth(req),simpleGit.fetch(),pm2.connect()]
    let [branch] = await Promise.all(promiseArr)
    branch = branch.trim()
    const resetResult = await simpleGit.reset(["--hard",commitSHA])
    res.end(`
    Resetting branch ${branch}
    To commit ${commitSHA}
    `)
    const reloadResult = await pm2.reload("hwboard2-web")
    await pm2.disconnect()
    console.log("Done")
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

module.exports = router
