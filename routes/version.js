const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git')();
const {promisify} = require("util");
const {fetch,revparse,show,log} = simpleGit;

simpleGit.revparse = promisify(revparse);
simpleGit.fetch = promisify(fetch);
simpleGit.show = promisify(show);
simpleGit.log = promisify(log);

router.get("/cd/version.json",(req, res) => {
  (async ()=>{
    const promiseArr = [
      simpleGit.revparse(["--abbrev-ref","HEAD"]),
      simpleGit.revparse(["HEAD"]),
      simpleGit.show(["-s","--format=%ci","HEAD"])
    ];
    const results = await Promise.all(promiseArr);
    const [branch,commitSha,lastUpdate] = results.map(string => string.trim());
    res.type("json");
    res.end(JSON.stringify({
      branch,
      commitSha,
      lastUpdate
    }));
  })()
    .catch((e)=>{
      const code = e.code || 500;
      res.status(code).end(e.toString());
      console.log(e);
    });
});
router.get("/cd/version",(req, res) => {
  (async ()=>{
    res.set('Content-Type','text/plain');
    await simpleGit.fetch();
    const promiseArr = [
      simpleGit.revparse(["--abbrev-ref","HEAD"]),
      simpleGit.revparse(["HEAD"]),
      simpleGit.show(["-s","--format=%ci","HEAD"])
    ];
    let [branch,commitSha,lastUpdate] = await Promise.all(promiseArr);
    branch = branch.trim();
    const latestCommits = await simpleGit.log(["HEAD^..origin/"+branch]);
    const latest = JSON.stringify(latestCommits.all[0],null,2);
    const thisCommit = JSON.stringify(latestCommits.all[latestCommits.all.length-1],null,2);
    res.end(`
    Branch: ${branch}
    Commit SHA: ${commitSha}
    Last updated: ${lastUpdate}

    Latest commit: 

${latest}

    This commit:

${thisCommit}
    `);
  })()
    .catch((e)=>{
      const code = e.code || 500;
      res.status(code).end(e.toString());
      console.log(e);
    });
});

module.exports = router;
