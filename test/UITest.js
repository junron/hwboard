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
  console.log("pageopen")
  await page.goto('http://localhost:' + port)
  console.log("pageloaad")
  await page.screenshot({path: './artifacts/initial.png'})
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
  const backdrop = await page.$(".sheet-backdrop")
  const coords = await getCoords(elem)
  //Close info dialog
  //X can be anything
  //20 is safe for Y because it is definitely in the backdrop
  await mouse.click(coords.left+500,20)
  await page.waitFor(1000)
  //Swipe
  await mouse.move(coords.left+500,coords.top)
  await mouse.down()
  await mouse.move(coords.left+300,coords.top)
  await mouse.up()
  const deleteBtn = await page.$(".targetHomework .swipeout-actions-right a:not(.swipeout-edit-button)")
  await deleteBtn.click()
  await page.screenshot({path: './artifacts/delete-before.png'})
  const okBtn = await page.$("span.dialog-button.dialog-button-bold")
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
  const coords = await getCoords(elem)
  console.log(coords)
  await page.screenshot({path: './artifacts/info-before.png'})
  mouse.move(coords.left,coords.top)
  mouse.down()
  mouse.move(coords.left+200,coords.top)
  await page.screenshot({path: './artifacts/info-middle.png'})
  mouse.up()
  await page.screenshot({path: './artifacts/info.png'})
}
async function add(){
  await page.click("#fab-add-homework")
  await page.type("#subject-name","math")
  await page.click(".item-radio.item-content[data-value=math]")
  await page.click(".toggle.color-red.toggle-init")
  await page.waitFor("#toggle-is-graded-checkbox:checked")
  await page.type("#dueDate","tomorrow")
  await page.type("#homework-name","Add homework test")
  await page.screenshot({path: './artifacts/add.png'})
  await page.click("#update-hwboard-button")
  await page.waitFor(100)
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
  this.timeout(0);
  before(async function(){
    server.listen(port)
    await init()
  })
  it("Should be able to add homework",async function(){
    return await add()
  })
  it("Should be able to show info dialog",async function(){
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
  })
  it("Should be able to remove homework",async function(){
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
