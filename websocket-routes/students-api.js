/* 
 * This file deals with student data operations
 */

const students = require("../students.js");

module.exports = socket=>{

  //Send uncaught errors, eg `callback is not a function` to client
  const uncaughtErrorHandler = require("./error")(socket);

  socket.on("studentDataReq",function(msg,callback){
    (async ()=>{
      const {method,data} = msg;
      const result = await students[method](data);
      return callback(null,result);
    })()
      .catch(e => {
        console.log(e);
        throw e;
      })
      .catch(e => callback(e.toString()))
    //Error in handling error
      .catch(uncaughtErrorHandler);
  });

};