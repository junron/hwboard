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
      const methodList = {
        "getStudentById":200,
        "getClasses":100,
        "getStudentByName":20,
        "getStudentsByClassName":4,
        "searchStudents":50,
      };
      if(!Object.keys(methodList).includes(method)){
        throw new Error("Invalid method");
      }
      if(typeof socket.studentAPIQueries==="undefined"){
        socket.studentAPIQueries = {};
      }
      if(typeof socket.studentAPIQueries[method]==="undefined"){
        socket.studentAPIQueries[method] = {
          times:0,
          lastReset: new Date().getTime()
        };
      }else{
        const usage = socket.studentAPIQueries[method];
        if(usage.lastReset- new Date().getTime()>60000){
          socket.studentAPIQueries[method] = {
            times:0,
            lastReset: new Date().getTime()
          };
        }else{
          usage.times++;
          if(usage.times>methodList[method]){
            throw new Error("Student API quota exceeded");
          }
        }
      }
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