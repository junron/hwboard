let {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HWBOARD_HOSTNAME:HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI} = process.env
try {
  //TODO find better way to do destructuring assignment
  //My ES6 sucks
  //Assignment expression
  ({POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI} = require("./config.json"))
} catch (error) {
  //Could not load config
  console.log("Config file not found, using environment variables")
}
CI = (CI=="true") || CI || (process.env.CI=="true") || false
if(CI==true){
  //Auth credentials not needed for ci
  MS_CLIENTID="hello"
  MS_CLIENTSECRET="world"
  HOSTNAME = HOSTNAME || "not required"
}
PORT = PORT || 3001
const finalConfig = {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI}
if(Object.values(finalConfig).includes(undefined)){
  throw new Error(Object.entries(finalConfig) + " contains undefined.")
}
module.exports = finalConfig