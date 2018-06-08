const puppeteer = require("puppeteer")
const devices = require('puppeteer/DeviceDescriptors')
const nexus = devices['Nexus 5']
const mocha = require("mocha")
const {expect} = require("chai")
const port = require("../loadConfig").PORT
const server = require("../app").server
const options = {
    headless:false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    //Slow down so you can see whats happening
    slowMo:30
}
if(process.env.CI_PROJECT_NAME=="hwboard2"){
  console.log("Gitlab env")
  //No display in CI
  options.headless = true
  options.slowMo = 0
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
  browser = await puppeteer.launch(options)
  console.log("browser launch")
  page = await browser.newPage()
  page.emulate(nexus)
  console.log("pageopen")
  await page.goto('http://localhost:' + port)
  console.log("pageloaad")
  await page.screenshot({path: './artifacts/mobile-initial.png'})
}
async function showToolbar(){
  //Long tap
  const duration = 1080
  await page.evaluate((duration)=>{
    //Needs at least 1000ms to activate
    console.log(duration)
    const touchStartEvent = new Event("touchstart")
    const touchEndEvent = new Event("touchend")
    $(".hwitem:contains('Add homework test')")[0].dispatchEvent(touchStartEvent)
    setTimeout(()=>{
      $(".hwitem:contains('Add homework test')")[0].dispatchEvent(touchEndEvent)
    },duration)
  },duration)
  await page.waitFor(duration)
}
async function remove(){
  await page.waitFor(300)
  await showToolbar()
  await page.evaluate(()=>{
    $("i:contains('')").click()
  })
  await page.waitFor(300)
  await page.evaluate(()=>{
    $("button[onclick='deleteHomework()']").click()
  })
  await page.waitFor(300)
  await page.screenshot({path: './artifacts/mobile-delete.png'})
}
async function info(){
  await page.waitFor(300)
  await showToolbar()
  await page.evaluate(()=>{
    $("i:contains('')").click()
  })
  await page.waitFor(300)
  await page.screenshot({path: './artifacts/mobile-info.png'})
}
async function add(){
  await page.tap(".app-fab--absolute")
  await page.tap("#subject-select .mdc-select__surface")
  await page.waitFor(300)
  await page.evaluate(()=>{
     $("li:contains('math')").click()
  })
  await page.waitFor(300)
  await page.tap("#graded")
  await page.waitFor(300)
  await page.type("#dueDate","tomorrow")
  await page.waitFor(300)
  await page.type("#hwname","Add homework test")
  await page.waitFor(300)
  await page.screenshot({path: './artifacts/mobile-add.png'})
  await page.tap("#updateBtn")
}
async function checkDate(date){
  await page.tap(".app-fab--absolute")
  await page.waitFor(200)
  const dateInput = await page.$('#dueDate')
  await dateInput.type(date)
  await page.waitFor(1000)
  return page.evaluate(async ()=>{
    const date = parseDate()
    if(date){
      return date.toString()
    }else{
      return "error"
    }
    
  })
}
function getDate(date){
  if(date=="error"){
    return "error"
  }
  return date.getDate()+"/"+date.getMonth()+1+"/"+date.getFullYear()
}
describe("Hwboard",async function(){
  this.timeout(0);
  before(async function(){
    server.listen(port)
    await init()
  })
  it("Should be able to add homework",async function(){
    await add()
  })
  it("Should be able to show info dialog",async function(){
    await info()
    const name = await getHtml("#details-sheet-label")
    const subject = await getHtml("#detailSubject")
    expect(subject).to.equal("math")
    const dueDate = await getHtml("#detailDue")
    const graded = await getHtml("#detailGraded")
    expect(graded).to.equal("Yes")
    const lastEdit = await getHtml("#detailLastEdit")
    console.log("Data:")
    console.log({name,subject,dueDate,graded,lastEdit})
  })
  it("Should be able to remove homework",async function(){
    await remove()
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
    return
  })
})
