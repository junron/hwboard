const express = require('express')
const router = express.Router()


router.get("/addChannel",(req, res) => {
  return res.render("addChannel")
})

module.exports = router
