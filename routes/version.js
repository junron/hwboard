const express = require('express')
const router = express.Router()
const simpleGit = require('simple-git')()
const {promisify} = require("util")
const {fetch,revparse} = simpleGit

simpleGit.revparse = promisify(revparse)
simpleGit.fetch = promisify(fetch)

router.get("/cd/version",(req, res) => {
  ;(async ()=>{
    const promiseArr = [simpleGit.revparse(["--abbrev-ref","HEAD"]),simpleGit.revparse(["HEAD"])]
    let [branch,commitSha] = await Promise.all(promiseArr)
    res.end(`
    Branch: ${branch}
    Commit SHA: ${commitSha}
    `)
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

module.exports = router
