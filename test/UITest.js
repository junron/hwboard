'use strict'
const puppeteer = require("puppeteer")
const mocha = require("mocha")
const {expect} = require("chai")
const port = require("../loadConfig").PORT
const {server,io} = require("../app")

const options = {
  headless:false,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  //Slow down so you can see whats happening
  slowMo:10
}
if(process.env.CI_PROJECT_NAME=="hwboard2"){
  console.log("Gitlab env")
  //No display in CI
  options.headless = true
  options.executablePath = '/usr/bin/chromium-browser'
}
let browser
let page

let currentlyRecordingTrace = false

const getHtml = async selector => {
  return page.evaluate((selector)=>{
    console.log(selector)
    return document.querySelector(selector).innerHTML
  },selector)
}
async function init(){
  const {init:dbInit} = require("../database")
  await dbInit()
  browser = await puppeteer.launch(options)
  console.log("browser launch")
  page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('requestfailed', request =>{
    console.log(Object.entries(request))
  })
  page.on('request', req =>req.continue())
  console.log("pageOpen")
  await page.goto('http://localhost:' + port)
  console.log("pageLoad")
  await page.screenshot({path: './artifacts/initial.png'})
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  console.log("Browser + page ready")
  console.log("Browser version:",await browser.version())
}

async function remove(){
  let elem = await page.$(".targetHomework")
  while(!elem){
    await page.waitForFunction(()=>{
      return $($(".hwitem:contains('Add homework test')")[0]).addClass("targetHomework")
    })
    elem = await page.$(".targetHomework")
  }
  console.log(await page.evaluate(_ => {
    return new Promise((resolve,reject)=>{
      Framework7App.swipeout.open(document.querySelector(".targetHomework"),"right",()=>{
        resolve("Opened right swipeout")
      })
    })
  }))
  page.waitFor(2000)
  const deleteBtn = await page.$(".targetHomework .swipeout-actions-right a:not(.swipeout-edit-button)")
  await page.screenshot({path: './artifacts/delete-before.png'})
  await deleteBtn.click()
  const okBtn = await page.$("span.dialog-button.dialog-button-bold")
  await page.waitFor(500)
  await okBtn.click()
  await page.waitFor(500)
  await page.screenshot({path: './artifacts/delete.png'})
}
async function info(){
  let elem = await page.$(".targetHomework")
  while(!elem){
    await page.waitForFunction(()=>{
      return $($(".hwitem:contains('Add homework test')")[0]).addClass("targetHomework")
    })
    elem = await page.$(".targetHomework")
  }
  await page.screenshot({path: './artifacts/info-before.png'})
  console.log(await page.evaluate(_ => {
    return new Promise(resolve=>{
      Framework7App.swipeout.open(document.querySelector(".targetHomework"),"left",()=>{
        resolve("Opened left swipeout")
      })
    })
  }))
  await page.screenshot({path: './artifacts/info-middle.png'})
  await page.waitFor(1000)
  await page.click(".targetHomework .swipeout-actions-left a.swipeout-overswipe")
  console.log("Clicked")
  await page.waitFor(2000)
  await page.screenshot({path: './artifacts/info.png'})
}
async function add(){
  console.log("Called")
  await page.click("#fab-add-homework")
  console.log("Clicked")
  await page.waitFor(1000)
  await page.waitFor("#subject-name")
  await page.type("#subject-name","math")
  console.log("waited")
  await page.click('.md > li > #selectTagsElem > .item-content > .item-inner')
  await page.click('.md > li > #selectTagsElem')
  console.log("clicked")
  await page.waitFor(1000)
  const elem = await page.waitForFunction(()=>{
    return $(`.smart-select-page label.item-checkbox:has(input[value=Graded])`)[0]
  })
  await elem.click()
  await page.click(`.smart-select-page .navbar .left a`)
  await page.waitFor(1000)
  await page.type("#dueDate","tomorrow")
  await page.type("#homework-name","Add homework test")
  await page.screenshot({path: './artifacts/add.png'})
  await page.click("#update-hwboard-button")
  await page.waitFor(500)
  return await page.waitForFunction(()=>{
    return $($(".hwitem:contains('Add homework test')")[0]).addClass("targetHomework")
  })
}
describe("Hwboard",async function(){
  this.timeout(15000);
  before(async function(){
    this.timeout(40000)
    server.listen(port)
    return await init()
  })
  afterEach(async function(){
    if(currentlyRecordingTrace){
      await page.tracing.stop()
      currentlyRecordingTrace = false
    }
    if(!page.isClosed()){
      await page.goto('http://localhost:' + port)
      return await page.waitFor(2000)
    }else{
      return console.log("Page has been closed, not refreshing")
    }
  })
  it("Should load channel data",async function (){
    this.timeout(0)
    const [subjectChannelMapping,subjectTagMapping,subjectSelectionList] = await Promise.all((await Promise.all([
      page.waitForFunction(()=>{
        if(typeof subjectChannelMapping==="undefined"){
          return false
        }
        if(Object.keys(subjectChannelMapping).length===0){
          return false
        }
        return subjectChannelMapping
      }),
      page.waitForFunction(()=>{
        if(typeof subjectTagMapping==="undefined"){
          return false
        }
        if(Object.keys(subjectTagMapping).length===0){
          return false
        }
        return subjectTagMapping
      }),
      page.waitForFunction(()=>{
        if(typeof subjectSelectionList==="undefined"){
          return false
        }
        if(subjectSelectionList.length===0){
          return false
        }
        return subjectSelectionList
      })
    ])).map(handle => handle.jsonValue()))
    console.log({subjectChannelMapping,subjectTagMapping})
    expect(subjectChannelMapping).to.be.an("object")
    expect(subjectTagMapping).to.be.an("object")
    expect(subjectSelectionList).to.be.an("array")
    expect(subjectChannelMapping).to.deep.equal({ 
      math: 'testing', 
      chemistry: 'testing' 
    })
    expect(subjectSelectionList).to.deep.equal(["math","chemistry"])
    expect(subjectTagMapping).to.deep.equal({ 
      math: { 
        Graded: 'red', 
        Optional: 'green' 
      },
      chemistry: { 
        Graded: 'red', 
        Optional: 'green' 
      } 
    })
  })
  it("Should be able to add homework",async function(){
    // this.timeout(0)
    await page.tracing.start({path: 'artifacts/add.json', screenshots: true});
    currentlyRecordingTrace = true
    await add()
    // await page.waitFor(1000000000)
  })
  // it("Should be able to show info dialog",function(done){
  //   console.log('\x1b[36m%s\x1b[0m',"Attempt to show info dialog")
  //   ;(async ()=>{
  //     await page.tracing.start({path: 'artifacts/info.json', screenshots: true});
  //     currentlyRecordingTrace = true
  //     await info()
  //     const name = await getHtml("#detailHomeworkName")
  //     const subject = await getHtml("#detailSubject")
  //     const dueDate = await getHtml("#detailDue")
  //     const graded = await getHtml("#detailGraded")
  //     const lastEdit = await getHtml("#detailLastEdit")
  //     console.table({name,subject,dueDate,graded,lastEdit})
  //     console.log({name,subject,dueDate,graded,lastEdit})
  //     expect(subject).to.equal("math")
  //     expect(graded).to.equal("Yes")
  //   })().catch(e=>{
  //     throw e
  //   }).then(done)
  // })
  it("Should be able to remove homework",async function(){
    await page.tracing.start({path: 'artifacts/remove.json', screenshots: true});
    currentlyRecordingTrace = true
    console.log('\x1b[36m%s\x1b[0m',"Attempt to remove homework")
    await remove()
  })

  it("Should perform decently for Lighthouse audits",async function(){
    const url = 'http://localhost:' + port
    const lighthouse = require("lighthouse")
    page.close()
    const {URL} = require("url")
    const {lhr} = await lighthouse(url, {
      port: (new URL(browser.wsEndpoint())).port,
      output: 'json',
      logLevel: 'info',
    })
    const fs = require("fs")
    fs.writeFileSync("./artifacts/lighthouse.json",JSON.stringify(lhr))
    console.log(`Lighthouse scores:`)
    const scores = {}
    for(const category in lhr.categories){
      scores[category] = lhr.categories[category].score
    }
    console.table(scores)
    console.log(scores)
    //Note: scores for performance and PWA are significantly lower 
    //This is due to lack of HTTPS and NGINX compression and h2
    expect(scores.pwa).to.be.greaterThan(0.3)
    expect(scores.accessibility).to.be.greaterThan(0.85)
    expect(scores["best-practices"]).to.be.greaterThan(0.85)
    expect(scores.seo).to.be.greaterThan(0.89)
  })
  after(async function(){
    await browser.close()
    server.close()
    io.close()
    return
  })
})
