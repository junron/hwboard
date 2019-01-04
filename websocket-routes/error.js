//yey currying
const uncaughtError = socket => err =>{
  console.log(err);
  socket.emit("uncaughtError",err.toString());
};

module.exports = uncaughtError;