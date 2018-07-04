function or(obj1,obj2){
  const result = {}
  for (const key in obj1){
    if(!obj1[key]){
      result[key] = obj2[key]
    }else{
      result[key] = obj1[key]
    }
  }
  for (const key in obj2){
    if(!result[key]){
      result[key] = obj2[key]
    }
  }
  return result
}

let finalSettings
let configFileSettings
const envVarSettings = Object.assign({},process.env)

envVarSettings.HOSTNAME = envVarSettings.HWBOARD_HOSTNAME
delete envVarSettings.HWBOARD_HOSTNAME
envVarSettings.PORT = envVarSettings.HWBOARD_PORT
delete envVarSettings.HWBOARD_PORT
envVarSettings.COOKIE_SECRET = envVarSettings.HWBOARD_COOKIE_SECRET
delete envVarSettings.HWBOARD_COOKIE_SECRET

try {
  configFileSettings = require("./config.json")
  finalSettings = or(envVarSettings,configFileSettings)
} catch (error) {
  //Could not load config
  console.log("Config file not found, using environment variables")
  finalSettings = envVarSettings
}
let {POSTGRES_PASSWORD,POSTGRES_USER,POSTGRES_DB,HOSTNAME,MS_CLIENTID,MS_CLIENTSECRET,PORT,CI,COOKIE_SECRET} = finalSettings
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
