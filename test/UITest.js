'use strict'
const puppeteer = require("puppeteer")
const mocha = require("mocha")
const {expect} = require("chai")
const port = require("../loadConfig").PORT
const server = require("../app").server
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
const getCoords = async elem =>{
  return page.evaluate((header) => {
    const {top, left, bottom, right} = header.getBoundingClientRect()
    return {top, left, bottom, right}
  }, elem)
}
async function init(){
  browser = await puppeteer.launch(options)
  console.log("browser launch")
  page = await browser.newPage()
  await page.tracing.start({path: 'artifacts/trace.json', screenshots: true});
  console.log("pageopen")
  await page.goto('http://localhost:' + port)
  console.log("pageloaad")
  await page.screenshot({path: './artifacts/initial.png'})
  await page._client.send('Emulation.clearDeviceMetricsOverride')
}

async function remove(){
  const mouse = page.mouse
  let elem = await page.$(".targetHomework")
  while(!elem){
    await page.waitForFunction(()=>{
      return $($(".hwitem:contains('Add homework test')")[0]).addClass("targetHomework")
    })
    elem = await page.$(".targetHomework")
  }
  console.log(await page.evaluate(_ => {
    Framework7App.swipeout.open(document.querySelector(".targetHomework"),"right",()=>{
      Promise.resolve("Opened right swipeout")
    })
  }))
  page.waitFor(1000)
  await page.tracing.stop();
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
  const mouse = page.mouse
  let elem = await page.$(".targetHomework")
  while(!elem){
    await page.waitForFunction(()=>{
      return $($(".hwitem:contains('Add homework test')")[0]).addClass("targetHomework")
    })
    elem = await page.$(".targetHomework")
  }
  await page.screenshot({path: './artifacts/info-before.png'})
  console.log(await page.evaluate(_ => {
    Framework7App.swipeout.open(document.querySelector(".targetHomework"),"left",()=>{
      Promise.resolve("Opened left swipeout")
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
async function checkDate(date){
  console.log(date)
  return page.evaluate(async (date)=>{
    try{
      console.log(date)
      const parsedDate = await parseDate(date)
      return parsedDate.toString()
    }catch(e){
      return "error"
    }
  },date)
}
function getDate(date){
  if(date=="error"){
    return "error"
  }
  return date.getDate()+"/"+date.getMonth()+1+"/"+date.getFullYear()
}
describe("Hwboard",async function(){
  this.timeout(20000);
  before(async function(){
    server.listen(port)
    await init()
  })
  afterEach(async ()=>{
    await page.goto('http://localhost:' + port)
    return await page.waitFor(2000)
  })
  it("Should be able to add homework",async function(){
    return await add()
  })
  it("Should be able to show info dialog",function(done){
    console.log('\x1b[36m%s\x1b[0m',"Attempt to show info dialog")
    ;(async ()=>{
      await info()
      const name = await getHtml("#detailHomeworkName")
      const subject = await getHtml("#detailSubject")
      expect(subject).to.equal("math")
      const dueDate = await getHtml("#detailDue")
      const graded = await getHtml("#detailGraded")
      expect(graded).to.equal("Yes")
      const lastEdit = await getHtml("#detailLastEdit")
      console.table = console.table || console.log
      console.table({name,subject,dueDate,graded,lastEdit})
    })().catch(e=>{
      throw e
    }).then(done)
  })
  it("Should be able to remove homework",async function(){
    console.log('\x1b[36m%s\x1b[0m',"Attempt to remove homework")
    return await remove()
  })
  // it("Should detect dates properly",async ()=>{
  //   const today = new Date()
  //   const tomorrow = new Date()
  //   const wednesday = new Date()
  //   const nextMonth = new Date()
  //   tomorrow.setDate(today.getDate()+1)
  //   wednesday.setDate(wednesday.getDate() + (3 + 7 - wednesday.getDay()) % 7)
  //   nextMonth.setMonth(nextMonth.getMonth()+1)
  //   const dates = ["tomorrow","wed","next month","wedneday","1970"]
  //   const expectedResults = [tomorrow.toString(),wednesday.toString(),nextMonth.toString(),"error","error"]
  //   let results = []
  //   for (let date of dates){
  //     results.push(await checkDate(date))
  //   }
  //   expect(JSON.stringify(results)).to.equal(JSON.stringify(expectedResults))
  // })
  after(async ()=>{
    await browser.close()
    return server.close()
  })
})
