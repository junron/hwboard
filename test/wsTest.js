const chai = require("chai")
const mocha = require("mocha")
const expect = chai.expect
//TODO actually use a token when auth is setup
const token = `bleh`
const io = require('socket.io-client')
const websocket = require("../app").server
const port = require("../loadConfig").PORT
let client
describe("websocket",function(){
    this.timeout(0000)
    before(function(done){
      websocket.listen(port)
      console.log("http://localhost:" + port)
      client = io("http://localhost:" + port)
      client.on("disconnect",()=>{
        console.log("Disconnect")
      })
      client.on("error",console.log)
      client.on("connect",()=>{
        console.log("connected")
        done()
      })
    })
    after(function(done){
      websocket.close()
      done()
      setTimeout(function(){
        process.exit(0)
      },500)
    })
    it("Should be able to echo text messages",function(done){
      console.log(client.connected)
        client.emit("textMessage","helloworld",function(err,response){
            expect(err).to.equal(null)
            expect(response).to.equal("helloworldreceived")
            done()
        })
    })
    it("Should be able to echo binary data",function(done){
        client.emit("binaryMessage",Buffer.from("hello","utf8"),function(err,response){
            expect(err).to.equal(null)
            expect(response).to.be.instanceOf(Buffer)
            expect(response.toString()).to.equal("helloreceived")
            done()
        })
    })
    it("Should be able to get data in the right format",function(done){
        client.emit("dataReq",{},function(err,homeworks){
            expect(err).to.equal(null)
            expect(homeworks).to.be.an("array")
           for (let homework of homeworks){
               expect(homework).to.be.an("object")
               expect(homework.id).to.be.a("number")
               expect(homework.subject).to.be.a("string")
               let dueDateNum = new Date(homework.dueDate).getTime()
               expect(dueDateNum).to.be.a("number")
               expect(dueDateNum).to.be.above(1500000000)
               expect(homework.isTest).to.be.a("boolean")
               expect(homework.lastEditPerson).to.be.a("string")
               expect(new Date(homework.lastEditTime)).to.be.a.instanceof(Date)
               expect(homework.text).to.be.a("string")
           }
           done()
        })
        
    })
    it("Should be able to add homework",function(done){
      const newHomework = {
        text:"hello",
        channel:"testing",
        subject:"add homework via websocket test",
        dueDate:new Date().getTime()+10000000,
        isTest:true,
        token
      }
      client.emit("addReq",newHomework,function(err){
        expect(err).to.equal(null)
        client.emit("dataReq",{},function(err,homeworks){
          for(let homework of homeworks){
            if(homework.subject=="add homework via websocket test"){
              expect(homework.text).to.equal(newHomework.text)
              break
            }
          }
          done()
        })
      })
    })
    it("Should be able to edit homework",function(done){
      client.emit("dataReq",{},function(err,homeworks){
        const originalHomework = homeworks.find(homework => homework.subject =="add homework via websocket test")
        const newHomework = {
          text:"hello(edited)",
          channel:"testing",
          subject:"Edit homework via websocket test",
          dueDate:new Date().getTime()+10000000,
          isTest:true,
          token,
          id:originalHomework.id
        }
        client.emit("editReq",newHomework,function(err){
          expect(err).to.equal(null)
          client.emit("dataReq",{},function(err,homeworks){
            const editedHomework = homeworks.find(homework => homework.subject =="Edit homework via websocket test")
            expect(editedHomework.text).to.equal(newHomework.text)
            expect(editedHomework.id).to.equal(newHomework.id)
            done()
          })
        })
      })
    })
    it("Should be able to delete homework",function(done){
      const promises = []
      client.emit("dataReq",{removeExpired:false},async function(err,homeworks){
        let homeworkCount = 0
        for(let homework of homeworks){
          const {id} = homework
          client.emit("deleteReq",{id,channel:"testing"},function(err){
              if(err) throw err;
              if(homeworkCount==homeworks.length-1){
                client.emit("dataReq",{removeExpired:false},async function(err,homeworks){
                  expect(homeworks.length).to.equal(0)
                })
                done()
              }else{
                homeworkCount+=1
              }
          })
        }
      })
      })
})
