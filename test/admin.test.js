const chai = require("chai");
chai.use(require('chai-uuid'));
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const {PORT:port} = require("../loadConfig");


let client;
describe("Admin API",function(){
  this.timeout(3000);
  before(function(done){
    websocket.listen(port);
    client = io("http://localhost:" + port);
    client.once("ready",done);
  });
  after(function(done){
    websocket.close();
    done();
  });

  it("Should be able to add channels",function(done){
    this.timeout(3000);
    const name = "testing";
    client.emit("addChannel",name,(err,name)=>{
      console.log("Created channel",name);
      expect(err).to.be.null;
      expect(name).to.equal("testing");
      client.emit("channelDataReq",{},function(err,channels){
        expect(err).to.be.null;
        const testChannel = channels.find(c=>c.name===name);
        expect(testChannel.tags).to.deep.equal({
          Graded:"red",
          Optional:"green",
        });
        expect(testChannel.roots).to.deep.equal(["tester@nushigh.edu.sg"]);
        done();
      });
    });
  });
  it("Should not be able to add duplicate channels",function(done){
    const name = "testing";
    client.emit("addChannel",name,err=>{
      expect(err).to.be.not.null;
      console.log(err.toString());
      done();
    });
  });
  it("Should not be able to add channels that overwrite the prototype",function(done){
    const name = "__proto__";
    client.emit("addChannel",name,err=>{
      expect(err).to.be.not.null;
      console.log(err.toString());
      done();
    });
  });
  it("Should be able to add subjects",function(done){
    const channel= "testing";
    client.emit("addSubject",{
      channel,
      subject:"math",
      data:{}
    },err=>{
      expect(err).to.be.null;
      client.emit("addSubject",{
        channel,
        subject:"chemistry",
        data:{}
      },err=>{
        expect(err).to.be.null;
        client.emit("channelDataReq",{},function(err,channels){
          expect(err).to.be.null;
          const testChannel = channels.find(c=>c.name===channel);
          expect(testChannel.subjects).to.deep.equal(["math","chemistry"]);
          expect(testChannel.roots).to.deep.equal(["tester@nushigh.edu.sg"]);
          done();
        });
      });
    });
  });
  it("Should be able to add admins and members",function(done){
    const channel= "testing";
    client.emit("addMember",{
      channel,
      students:["admin"],
      permissions:"admin"
    },err=>{
      expect(err).to.be.null;
      client.emit("addMember",{
        channel,
        students:["member"],
        permissions:"member"
      },err=>{
        expect(err).to.be.null;
        client.emit("channelDataReq",{},function(err,channels){
          expect(err).to.be.null;
          const testChannel = channels.find(c=>c.name===channel);
          expect(testChannel.roots).to.deep.equal(["tester@nushigh.edu.sg"]);
          expect(testChannel.admins).to.deep.equal(["admin@nushigh.edu.sg"]);
          expect(testChannel.members).to.deep.equal(["member@nushigh.edu.sg"]);
          done();
        });
      });
    });
  });
});
