const {remoteReplication} = require("../controllers/replication");
module.exports = async (socket,method,data)=>{
  if(socket.userData.name==="replication_user") return;
  return remoteReplication({method,user:socket.username,params:data});
};