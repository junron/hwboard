let {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET} = process.env
try {
  //TODO find better way to do destructuring assignment
  //My ES6 sucks
  //Assignment expression
  ({POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET} = require("./config.json"))
} catch (error) {
  //Could not load config
  console.log("Config file not found, using environment variables")
}
if(process.enc.CI=="true"){
  //Auth credentials not needed for ci
  MS_CLIENTID="hello"
  MS_CLIENTSECRET="world"
}
const finalConfig = {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET}
if(Object.values(finalConfig).includes(undefined)){
  throw new Error(JSON.stringify(finalConfig) + " contains undefined.")
}
module.exports = finalConfig