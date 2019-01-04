const variables = [
  {
    name:"HOSTNAME",
    env:["HWBOARD_HOSTNAME"],
    default:"",
  },
  {
    name:"COOKIE_SECRET",
    env:[],
    default:"VeryInsecureCookieSecret",
  },
  {
    name:"DB_USER",
    default:"hwboard",
  },
  {
    name:"DB_NAME",
    default:"hwboard",
  },
  {
    name:"DB_PASSWORD",
    default:"",
  },
  {
    name:"DB_PORT",
    default:5432,
  },
  {
    name:"USE_POSTGRES",
    default:true
  },
  {
    name:"COCKROACH_DB_SECURE",
    default:true,
  },
  {
    name:"CI",
    default:false
  },
  {
    name:"MS_CLIENTID",
    default:"",
  },
  {
    name:"MS_CLIENTSECRET",
    default:"",
  },
  {
    name:"PORT",
    env:["HWBOARD_PORT"],
    default:3001,
  },
  {
    name:"SEQUELIZE_LOGGING",
    default:true
  },
  {
    name:"GITLAB_SECURE_TOKEN",
    default:null,
  },
  {
    name:"REDUCE_EXPRESS_LOGS",
    default:true
  }
];

let finalSettings = {};
let configFileSettings = false;
const envVarSettings = Object.assign({},process.env);

try{
  configFileSettings = require("./config.json");
}catch(e){
  console.log("Config file not found, using environment variables");
}

for(const variable of variables){
  //Expand short syntax
  if(typeof variable.file==="undefined"){
    variable.file = [variable.name];
  }
  if(typeof variable.env==="undefined"){
    variable.env = variable.file;
  }
  if(configFileSettings){
    //Get variables from config file if possible
    for(const name of variable.file){
      if(typeof configFileSettings[name] !== "undefined"){
        finalSettings[variable.name] = configFileSettings[name];
        break;
      }
    }
  }
  //Skip env vars if variable defined in config file
  if(typeof finalSettings[variable.name]!="undefined"){
    continue;
  }
  //Get variables from env vars
  for(const name of variable.env){
    if(typeof envVarSettings[name] !== "undefined"){
      console.log(variable.env,name,envVarSettings["MS_CLIENTID"]);
      finalSettings[variable.name] = envVarSettings[name];
      break;
    }
  }
  //Set default
  if(typeof finalSettings[variable.name]==="undefined"){
    finalSettings[variable.name] = variable.default;
  }
  //Variable is not defined, throw error
  if(typeof finalSettings[variable.name]==="undefined"){
    throw new Error(`Variable ${variable.name} could not be found in either config file or environment variables`);
  }
}
module.exports = finalSettings;