const chai = require("chai")
const mocha = require("mocha")
const expect = chai.expect
//TODO actually use a token when auth is setup
const token = `bleh`
const io = require('socket.io-client')
const websocket = require("../app").server
let client
describe("websocket",function(){
    before(function(done){
      websocket.listen(3001)
      done()
    })
    beforeEach(function(done){
        client = io("http://localhost:3001",{ 
        transports: ['websocket'], 
        forceNew: true,
        reconnection: false
    })
    done()
    })
    afterEach(function(done){
      client.disconnect()
      done()
    })
    after(function(done){
      websocket.close(function(){
        done()
        setTimeout(function(){
          process.exit(0)
        },500)
        
      })
    })
    it("Should be able to echo text messages",function(done){
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
        client.emit("dataReq",null,function(err,homeworks){
            expect(err).to.equal(null)
            expect(homeworks).to.be.an("array")
           for (let homework of homeworks){
               expect(homework).to.be.an("object")
               expect(homework.id).to.be.a("number")
               expect(homework.subject).to.be.a("string")
               expect(homework.dueDate).to.be.a("number")
               expect(homework.dueDate).to.be.above(1500000000)
               expect(homework.isTest).to.be.a("number")//or boolean
               expect(homework.lastEditPerson).to.be.a("string")
               expect(homework.lastEditTime).to.be.a("string")
               expect(homework.text).to.be.a("string")
           }
           done()
        })
        
    })
    it("Should be able to add homework",function(done){
      const newHomework = {
        "text":"hello",
        token
      }
      client.emit("addReq",newHomework,function(err){
      expect(err).to.equal(null)
      done()
    })
})
})