let {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HWBOARD_HOSTNAME:HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,HWBOARD_PORT:PORT,CI,HWBOARD_COOKIE_SECRET:COOKIE_SECRET} = process.env
try {
  //TODO find better way to do destructuring assignment
  //My ES6 sucks
  //Assignment expression
  ({POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI,COOKIE_SECRET} = require("./config.json"))
} catch (error) {
  //Could not load config
  console.log("Config file not found, using environment variables")
}
CI = (CI=="true") || CI || (process.env.CI=="true") || false
if(CI==true){
  //Auth credentials not needed for ci
  MS_CLIENTID="hello"
  MS_CLIENTSECRET="world"
  HOSTNAME = HOSTNAME || "not_required"
}
PORT = PORT || 3001
//Cant see errors easily in docker or CI
const isRemote = ((process.env.CI_PROJECT_NAME=="hwboard2") || process.env.IS_DOCKER=="true")
//Dont report errors in testing/dev mode
//But always report in docker or CI
const REPORT_ERRORS = !(CI && !isRemote)
const finalConfig = {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI,COOKIE_SECRET,REPORT_ERRORS}
if(Object.values(finalConfig).includes(undefined)){
  throw new Error(Object.entries(finalConfig) + " contains undefined.")
}
module.exports = finalConfig
