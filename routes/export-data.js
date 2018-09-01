const express = require('express')
const router = express.Router()
const authChannels = require("./authChannels")
const db = require("../database")
const {Readable} = require("stream")
const Json2csvStream = require('json2csv').Transform

const removePersonalData = homework =>{
  const homeworkClone = Object.assign({},homework)
  delete homeworkClone.lastEditPerson
  delete homeworkClone.lastEditTime
  return homeworkClone
}
router.get("/:channelName/data.json",(req, res, next) => {
  ;(async ()=>{
    const authData = await authChannels(req,res)
    if(authData=="redirected"){
      return
    }
    const {channelData} = authData
    const channel = channelData[req.params.channelName]
    if(channel){
      res.setHeader('Content-disposition', 'attachment; filename='+req.params.channelName+'.data.json')
      res.type("json")
      const data = (await db.getHomework(req.params.channelName,false))
      .map(removePersonalData)
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
      res.setHeader('Content-disposition', 'attachment; filename='+req.params.channelName+'.data.csv')
      res.type("csv")
      const data = (await db.getHomework(req.params.channelName,false))
      .map(removePersonalData)
      const dataStream = new Readable()
      dataStream._read = () => {};
      dataStream.push(JSON.stringify(data))
      dataStream.push(null)

      let fields
      if(data.length>0){
        fields = Object.keys(data[0])
      }else{
        fields = []
      }
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

router.get("/data.json",(req, res, next) => {
  ;(async ()=>{
    const authData = await authChannels(req,res)
    if(authData=="redirected"){
      return
    }
    const {channelData} = authData
    res.setHeader('Content-disposition', 'attachment; filename=data.json')
    res.type("json")
    const data = await db.getHomeworkAll(channelData,false)
    res.send(JSON.stringify(data))
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})

router.get("/data.csv",(req, res) => {
  ;(async ()=>{
    const authData = await authChannels(req,res)
    if(authData=="redirected"){
      return
    }
    const {channelData} = authData
    res.setHeader('Content-disposition', 'attachment; filename=data.csv')
    res.type("csv")
    const data = await db.getHomeworkAll(channelData,false)
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
  })()
  .catch((e)=>{
    const code = e.code || 500
    res.status(code).end(e.toString())
    console.log(e)
  })
})
module.exports = router