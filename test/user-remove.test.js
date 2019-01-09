const chai = require("chai");
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const port = require("../loadConfig").PORT;
let rootClient;
describe("Removing stuff",function(){
  this.timeout(3000);
  before(function(done){
    websocket.listen(port);
    setTimeout(()=>{
      console.log("http://localhost:" + port);
      rootClient = io("http://localhost:" + port);
      rootClient.on("disconnect",()=>{
        console.log("Disconnect");
      });
      rootClient.on("error",console.log);
      rootClient.on("connect",()=>{
        console.log("connected");
        rootClient.on("ready",done);
      },1000);
    });
  });
  after(function(done){
    websocket.close();
    done();
  });

  it("Should be able to remove tags",function(done){
    const channel= "testing";
    rootClient.emit("removeTag",{
      channel,
      tag:"test-root"
    },err=>{
      expect(err).to.be.null;
      rootClient.emit("channelDataReq",{},function(err,channels){
        expect(err).to.be.null;
        const testChannel = channels.find(c=>c.name===channel);
        expect(testChannel.tags).to.deep.equal({
          Graded:"red",
          Optional:"green",
          test:"#03a9f4"
        });
        done();
      });
    });
  });
  it("Should be able to remove admins and members",function(done){
    const channel= "testing";
    rootClient.emit("removeMember",{
      channel,
      students:["admin"]
    },err=>{
      expect(err).to.be.null;
      rootClient.emit("removeMember",{
        channel,
        students:["member"]
      },err=>{
        expect(err).to.be.null;
        rootClient.emit("channelDataReq",{},function(err,channels){
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
