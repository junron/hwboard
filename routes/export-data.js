const express = require('express')
const router = express.Router()
const authChannels = require("./authChannels")
const db = require("../database")
const {Readable} = require("stream")
const Json2csvStream = require('json2csv').Transform

router.get("/:channelName/data.json",(req, res) => {
  ;(async ()=>{
    const authData = await authChannels(req,res)
    if(authData=="redirected"){
      return
    }
    const {channelData} = authData
    const channel = channelData[req.params.channelName]
    if(channel){
      res.setHeader('Content-disposition', 'attachment; filename=data.json')
      res.type("json")
      const data = await db.getHomework(req.params.channelName,false)
      res.send(JSON.stringify(data))
    }else{
      res.status(404).end("Channel not found")
    }
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

router.get("/:channelName/data.csv",(req, res) => {
  ;(async ()=>{
    const authData = await authChannels(req,res)
    if(authData=="redirected"){
      return
    }
    const {channelData} = authData
    const channel = channelData[req.params.channelName]
    if(channel){
      res.setHeader('Content-disposition', 'attachment; filename=data.csv')
      res.type("csv")
      const data = await db.getHomework(req.params.channelName,false)
      const dataStream = new Readable()
      dataStream._read = () => {};
      dataStream.push(JSON.stringify(data))
      dataStream.push(null)

      console.log(data)
      const fields = Object.keys(data[0])
      const options = { fields }
      const transformOptions = { highWaterMark: 16384, encoding: 'utf-8' }
      const toCSV = new Json2csvStream(options, transformOptions)

      dataStream
      .pipe(toCSV)
      .pipe(res)
    }else{
      res.status(404).end("Channel not found")
    }
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

module.exports = router