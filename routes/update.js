const express = require('express')
const router = express.Router()
const simpleGit = require('simple-git')()
const {promisify} = require("util")
const {fetch,revparse,reset} = simpleGit
simpleGit.fetch = promisify(fetch)
simpleGit.revparse = promisify(revparse)
simpleGit.reset = promisify(reset)

const {GITLAB_SECRET_TOKEN:gitlabToken} = require("../loadConfig")
const {timingSafeEqual} = require("crypto")


async function auth(req){
  if(!gitlabToken){
    return
  }
  const bufferToken = Buffer.from(gitlabToken,"utf-8")
  const {headers} = req
  const bufferUserToken = Buffer.from(headers["X-Gitlab-Token"],"utf-8")
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
    const promiseArr = [simpleGit.revparse(["--abbrev-ref","HEAD"]),auth(),simpleGit.fetch()]
    let [branch,,fetchRes] = await Promise.all(promiseArr)
    branch = branch.trim()
    const result = await simpleGit.reset(["--hard","origin/"+branch])
    res.status(200).end(branch)
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

module.exports = router