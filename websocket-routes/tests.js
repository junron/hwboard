/* 
 * This file deals with testing and debug operations
 * This includes:
 * - Getting current username -> whoami
 * - echoing text messages -> textMessage
 * - echoing binary messages -> binaryMessage
 */


module.exports = (socket)=>{
  //For tests
  socket.on("whoami",function(msg,callback){
    return callback(null,socket.userData.preferred_username)
  })
  socket.on("textMessage",function(msg,callback){
    return callback(null,msg+"received")
  })
  socket.on("binaryMessage",function(msg,callback){
    const text = msg.toString()
    return callback(null,Buffer.from(text+"received","utf8"))
  })
}