/* 
 * This file deals with testing and debug operations
 * This includes:
 * - Getting current username -> whoami
 * - echoing text messages -> textMessage
 * - echoing binary messages -> binaryMessage
 */


module.exports = (socket)=>{
  const uncaughtErrorHandler = require("./error")(socket);

  //For tests
  socket.on("whoami",function(msg,callback){
    (async ()=>{
      return callback(null,socket.userData.preferred_username);
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  socket.on("textMessage",function(msg,callback){
    (async()=>{
      return callback(null,msg+"received");
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  socket.on("binaryMessage",function(msg,callback){
    (async()=>{
      const text = msg.toString();
      return callback(null,Buffer.from(text+"received","utf8"));
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
  socket.on("getHostName",function(callback){
    (async()=>{
      if(process.env.IS_DOCKER){
        callback(process.env.HOSTNAME);
      }else{
        throw new Error("Unauthorized");
      }
    })()
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });
};