const express = require('express');
const router = express.Router();

router.get("/logout",(_, res) => {
  (async ()=>{
    res.clearCookie("token");
    res.clearCookie("username");
    res.clearCookie("name");
    res.clearCookie("email");
    res.end(`<div class="page">
    <div class="navbar">
      <div class="navbar-inner">
        <!-- bar icon and link -->
        <a href="#" class="left panel-open" style="padding-left:10px"><i class="bar" style="color:#ffffff">&#xe900;</i></a>
            <div class="title">Logged out</div>
          </div>
      </div>
    <div class="page-content block">
      You have logged out successfully.
      <br>
      <br>
      <br>
    </div>
  </div>`);
  })()
    .catch((e)=>{
      const code = e.code || 500;
      res.status(code).end(e.toString());
      console.log(e);
    });
});

module.exports = router;