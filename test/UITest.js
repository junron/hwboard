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
}
let browser
let page
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
  console.log("pageopen")
  await page.goto('http://localhost:' + port)
  console.log("pageloaad")
  await page.screenshot({path: './artifacts/initial.png'})
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  console.log("Browser + page ready")
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
    return new Promise((resolve,reject)=>{
      Framework7App.swipeout.open(document.querySelector(".targetHomework"),"left",()=>{
        resolve("Opened left swipeout")
      })
    })
  }))
  await page.screenshot({path: './artifacts/info-middle.png'})
  const btn = await page.$(".targetHomework .swipeout-overswipe")
  await btn.click()
  await page.waitFor(1000)
  await page.screenshot({path: './artifacts/info.png'})
}
async function add(){
  await page.click("#fab-add-homework")
  await page.waitFor(1000)
  await page.waitFor("#subject-name")
  await page.type("#subject-name","math")
  await page.click(".item-content.input-toggle")
  await page.click(".toggle.color-red.toggle-init")
  console.log("Waiting for checkbox to be checked")
  //await page.waitFor("#toggle-is-graded-checkbox:checked")
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
    if(!page.isClosed()){
      await page.goto('http://localhost:' + port)
      return await page.waitFor(2000)
    }else{
      return console.log("Page has been closed, not refreshing")
    }
  })
  it("Should load channel data",async function (){
    await page.waitFor(1000);
    const [subjectChannelMapping,subjectTagMapping] = await Promise.all([
      page.evaluate(()=>{
        return subjectChannelMapping
      }),
      page.evaluate(()=>{
        return subjectTagMapping
      })
    ])
    expect(subjectChannelMapping).to.be.an("object")
    expect(subjectTagMapping).to.be.an("object")
    expect(subjectChannelMapping).to.deep.equal({ 
      math: 'testing', 
      chemistry: 'testing' 
    })
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
    await add()
    // await page.waitFor(100000000)
    return await page.tracing.stop()
  })
  it("Should be able to show info dialog",function(done){
    console.log('\x1b[36m%s\x1b[0m',"Attempt to show info dialog")
    ;(async ()=>{
      await page.tracing.start({path: 'artifacts/info.json', screenshots: true});
      await info()
      const name = await getHtml("#detailHomeworkName")
      const subject = await getHtml("#detailSubject")
      expect(subject).to.equal("math")
      const dueDate = await getHtml("#detailDue")
      const graded = await getHtml("#detailGraded")
      expect(graded).to.equal("Yes")
      const lastEdit = await getHtml("#detailLastEdit")
      if(console.table){
        console.table({name,subject,dueDate,graded,lastEdit})
      }else{
        console.log({name,subject,dueDate,graded,lastEdit})
      }
      await page.tracing.stop()
    })().catch(e=>{
      throw e
    }).then(done)
  })
  it("Should be able to remove homework",async function(){
    await page.tracing.start({path: 'artifacts/remove.json', screenshots: true});
    console.log('\x1b[36m%s\x1b[0m',"Attempt to remove homework")
    await remove()
    return await page.tracing.stop()
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
    if(console.table){
      console.table(scores)
    }
    console.log(scores)
    //Note: scores for performance and PWA are significantly lower 
    //This isdue to lack of HTTPS and NGINX compression and h2
    expect(scores.pwa).to.be.greaterThan(0.6)
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
