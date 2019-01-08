const chai = require("chai");
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const port = require("../loadConfig").PORT;
let client;
describe("Admin API",function(){
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

  it("Should be able to remove subjects",function(done){
    const channel= "testing";
    client.emit("removeSubject",{
      channel,
      subject:"math"
    },err=>{
      expect(err).to.be.null;
      client.emit("removeSubject",{
        channel,
        subject:"chemistry"
      },err=>{
        expect(err).to.be.null;
        client.emit("channelDataReq",{},function(err,channels){
          expect(err).to.be.null;
          const testChannel = channels.find(c=>c.name===channel);
          console.log(testChannel);
          expect(testChannel.subjects).to.deep.equal([]);
          expect(testChannel.roots).to.deep.equal(["tester@nushigh.edu.sg"]);
          done();
        });
      });
    });
  });
  it("Should be able to remove admins and members",function(done){
    const channel= "testing";
    client.emit("removeMember",{
      channel,
      students:["admin"]
    },err=>{
      expect(err).to.be.null;
      client.emit("removeMember",{
        channel,
        students:["member"]
      },err=>{
        expect(err).to.be.null;
        client.emit("channelDataReq",{},function(err,channels){
          expect(err).to.be.null;
          const testChannel = channels.find(c=>c.name===channel);
          console.log(testChannel);
          expect(testChannel.roots).to.deep.equal(["tester@nushigh.edu.sg"]);
          expect(testChannel.admins).to.deep.equal([]);
          expect(testChannel.members).to.deep.equal([]);
          done();
        });
      });
    });
  });
});
