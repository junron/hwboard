const chai = require("chai");
const request = require("request");
chai.use(require('chai-uuid'));
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const {COOKIE_SECRET:password,PORT:port} = require("../loadConfig");

let client;
describe("Hwboard switch user functionality",function(){
  this.timeout(3000);
  before(function(done){
    websocket.listen(port);
    done();
  });
  after(function(done){
    websocket.close();
    done();
  });

  it("Should be able to switch users",function(done){
    request.get("http://localhost:" + port+"/testing/su/",{
      qs:{
        switchUserName:"admin@nushigh.edu.sg",
        userPassword:password
      }
    },(err,res)=>{
      expect(err).to.be.null;
      const cookie = res.headers["set-cookie"][0].split(";")[0];
      client = io("http://localhost:"+port,{
        extraHeaders:{
          cookie
        }
      });
      client.on("ready",()=>{
        client.emit("whoami",null,(err,name)=>{
          console.log(name);
          expect(err).to.be.null;
          expect(name).to.equal("admin@nushigh.edu.sg");
          done();
        });
      });
    });
  });
  it("Should require authentication to switch user",function(done){
    request.get("http://localhost:" + port+"/testing/su/",{
      qs:{
        switchUserName:"admin@nushigh.edu.sg",
        userPassword:password+"wrong"
      }
    },(err,res)=>{
      expect(res.statusCode).to.equal(403);
      done();
    });
  });
});
