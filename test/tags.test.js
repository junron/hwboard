const chai = require("chai");
chai.use(require('chai-uuid'));
const {expect} = chai;
const io = require('socket.io-client');
const websocket = require("../app").server;
const port = require("../loadConfig").PORT;
let client;
describe("Hwboard tags",function(){
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

  it("Should be able to add tags",function(done){
    const tag = {
      channel:"testing",
      name:"test",
      color:"#03a9f4"
    };
    client.emit("addTag",tag,err=>{
      expect(err).to.be.null;
      client.emit("channelDataReq",{},function(err,channels){
        expect(err).to.be.null;
        const testChannel = channels.find(c=>c.name==="testing");
        expect(testChannel.tags).to.deep.equal({
          Graded:"red",
          Optional:"green",
          test:"#03a9f4"
        });
        done();
      });
    });
  });
});
