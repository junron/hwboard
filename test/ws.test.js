const chai = require("chai");
chai.use(require('chai-uuid'));
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const port = require("../loadConfig").PORT;
let client;
describe("websocket",function(){
  this.timeout(3000);
  before(function(done){
    websocket.listen(port);
    setTimeout(()=>{
      console.log("http://localhost:" + port);
      client = io("http://localhost:" + port);
      client.on("disconnect",()=>{
        console.log("Disconnect");
      });
      client.on("error",console.log);
      client.on("connect",()=>{
        console.log("connected");
        client.on("ready",done);
      },1000);
    });
  });
  after(function(done){
    websocket.close();
    done();
  });
  it("Should be able to echo text messages",function(done){
    console.log("Connected: ",client.connected);
    client.emit("textMessage","hello, world!",function(err,response){
      expect(err).to.equal(null);
      expect(response).to.equal("hello, world!received");
      done();
    });
  });
  it("Should be able to echo binary data",function(done){
    client.emit("binaryMessage",Buffer.from("hello, world!","utf8"),function(err,response){
      expect(err).to.equal(null);
      expect(response).to.be.instanceOf(Buffer);
      expect(response.toString()).to.equal("hello, world!received");
      done();
    });
  });
  it("Should be able to get data in the right format",function(done){
    client.emit("dataReq",{},function(err,homeworks){
      expect(err).to.equal(null);
      expect(homeworks).to.be.an("array");
      if(homeworks.length<1){
        console.log("\033[0;31m There is no homework to check format.\033[0m");
      }
      for (let homework of homeworks){
        if(!homework.tags){
          console.log(homework);
        }
        expect(homework).to.be.an("object");
        expect(homework.id).to.be.a.uuid('v4');
        expect(homework.subject).to.be.a("string");
        let dueDateNum = new Date(homework.dueDate).getTime();
        expect(dueDateNum).to.be.a("number");
        expect(dueDateNum).to.be.above(1500000000);
        expect(homework.tags).to.be.an("array");
        expect(homework.lastEditPerson).to.be.a("string");
        expect(new Date(homework.lastEditTime)).to.be.a.instanceof(Date);
        expect(homework.text).to.be.a("string");
      }
      done();
    });
      
  });
  it("Should be able to add homework",function(done){
    const newHomework = {
      text:"hello",
      channel:"testing",
      subject:"add homework via websocket test",
      dueDate:new Date().getTime()+10000000,
      tags:["Graded"]
    };
    client.emit("addReq",newHomework,function(err){
      expect(err).to.equal(null);
      client.emit("dataReq",{},function(err,homeworks){
        for(let homework of homeworks){
          if(homework.subject=="add homework via websocket test"){
            expect(homework.text).to.equal(newHomework.text);
            break;
          }
        }
        done();
      });
    });
  });
  it("Should be able to edit homework",function(done){
    client.emit("dataReq",{},function(err,homeworks){
      const originalHomework = homeworks.find(homework => homework.subject =="add homework via websocket test");
      const newHomework = {
        text:"hello(edited)",
        channel:"testing",
        subject:"Edit homework via websocket test",
        dueDate:new Date().getTime()+10000000,
        tags:["Graded"],
        id:originalHomework.id
      };
      client.emit("editReq",newHomework,function(err){
        expect(err).to.equal(null);
        client.emit("dataReq",{},function(err,homeworks){
          const editedHomework = homeworks.find(homework => homework.subject =="Edit homework via websocket test");
          expect(editedHomework.text).to.equal(newHomework.text);
          expect(editedHomework.id).to.equal(newHomework.id);
          done();
        });
      });
    });
  });
  it("Should be able to delete homework",function(done){
    client.emit("dataReq",{removeExpired:false},async function(err,homeworks){
      let homeworkCount = 0;
      for(let homework of homeworks){
        const {id} = homework;
        client.emit("deleteReq",{id,channel:"testing"},function(err){
          if(err) throw err;
          if(homeworkCount==homeworks.length-1){
            client.emit("dataReq",{removeExpired:false},async function(err,homeworks){
              expect(homeworks.length).to.equal(0);
            });
            done();
          }else{
            homeworkCount+=1;
          }
        });
      }
    });
  });
  it("Should be able to delete subjects without homework",function(done){
    const req = {
      channel:"testing",
      subject:"math"
    };
    client.emit("removeSubject",req,err=>{
      expect(err).to.be.null;
      client.emit("dataReq",{removeExpired:false},async function(err,channels){
        expect(err).to.be.null;
        const testChannel = channels.find(c=>c.name===req.channel);
        console.log(testChannel);
        done();
      });
    });
  });
});
