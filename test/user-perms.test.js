const chai = require("chai");
const request = require("request");
chai.use(require('chai-uuid'));
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const {COOKIE_SECRET:password,PORT:port} = require("../loadConfig");

const switchUser = name=>{
  return new Promise(resolve => {
    request.get("http://localhost:" + port+"/testing/su/",{
      qs:{
        switchUserName:name,
        userPassword:password
      }
    },(err,res)=>{
      const cookie = res.headers["set-cookie"][0].split(";")[0];
      const client = io("http://localhost:"+port,{
        extraHeaders:{
          cookie
        }
      });
      client.once("ready",()=>{
        resolve(client);
      });
    });
  });
};

let rootClient,adminClient,memberClient;
describe("Hwboard user access control",function(){
  this.timeout(3000);
  before(async function(){
    websocket.listen(port);
    rootClient = io("http://localhost:" + port);
    adminClient = await switchUser("admin@nushigh.edu.sg");
    memberClient = await switchUser("member@nushigh.edu.sg");
  });

  it("Should allow roots to add tags",function(done){
    const tag = {
      channel:"testing",
      name:"test-root",
      color:"#3366CC"
    };
    rootClient.emit("addTag",tag,err=>{
      expect(err).to.be.null;
      done();
    });
  });

  it("Should not allow admins to add tags",function(done){
    const tag = {
      channel:"testing",
      name:"test-admin",
      color:"#DC3912"
    };
    adminClient.emit("addTag",tag,err=>{
      expect(err).to.not.be.null;
      done();
    });
  });

  it("Should not allow members to add tags",function(done){
    const tag = {
      channel:"testing",
      name:"test-member",
      color:"#DC3912"
    };
    memberClient.emit("addTag",tag,err=>{
      expect(err).to.not.be.null;
      done();
    });
  });

  it("Should allow roots to add homework",function(done){
    const homework = {
      text:"Hello, this is hwboard root!!1",
      channel:"testing",
      subject:"math",
      dueDate:new Date().getTime()+10000000,
      tags:["Graded","test-root"]
    };
    rootClient.emit("addReq",homework,err=>{
      expect(err).to.be.null;
      done();
    });
  });

  it("Should allow admins to add homework",function(done){
    const homework = {
      text:"Hello, this is hwboard admin!!1",
      channel:"testing",
      subject:"math",
      dueDate:new Date().getTime()+10000000,
      tags:["Graded"]
    };
    adminClient.emit("addReq",homework,err=>{
      expect(err).to.be.null;
      done();
    });
  });

  it("Should not allow members to add homework",function(done){
    const homework = {
      text:"Hello, this is hwboard member!!1 I Should not be here?!!",
      channel:"testing",
      subject:"math",
      dueDate:new Date().getTime()+10000000,
      tags:["Graded"]
    };
    memberClient.emit("addReq",homework,err=>{
      expect(err).to.not.be.null;
      done();
    });
  });

  it("Should not allow subject to be deleted if homework still exists",function(done){
    const req = {
      channel:"testing",
      subject:"math"
    };
    rootClient.emit("removeSubject",req,err=>{
      expect(err).to.not.be.null;
      expect(err.toString()).to.equal("Error: Subjects with homework existing cannot be removed");
      done();
    });
  });

  after(function(done){
    websocket.close();
    done();
  });
});
