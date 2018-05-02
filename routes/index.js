const express = require('express');
const Sugar = require("sugar-date")
const router = express.Router();
const db = require("../database")
/* GET home page. */
router.get('/', (req, res, next) => {
  db.getHomework().then(function(data){
    res.render('index', { title: 'Express',data,Sugar,sortType:"Due date",sortOrder:0});
  })
});

module.exports = router;
