const Sequelize = require('sequelize-cockroachdb');

//Same as docker env variables 
//or use a config file
const {
  POSTGRES_PASSWORD:dbPasswd,
  POSTGRES_USER:dbUser,
  POSTGRES_DB:dbName="hwboard",
  SEQUELIZE_LOGGING:logging,
  COCKROACH_DB_PORT:cockroachDBPort,
  COCKROACH_DB_SECURE:cockroachSecure
} = require("../loadConfig")


let POSTGRES_HOST = "localhost"
//In docker, cockroachdb is on `cockroachdb` and not `localhost`
//Cos db container is called cockroachdb
//https://forums.docker.com/t/cant-get-postgres-to-work/29580/4
if(process.env.CI_PROJECT_NAME=="hwboard2" || process.env.IS_DOCKER=="true"){
  POSTGRES_HOST = "cockroachdb"
}

const config = {
  host:POSTGRES_HOST,
  port:cockroachDBPort,
  dialect: "postgres",
  operatorsAliases: Sequelize.Op
}
console.log({logging})
if(logging===false){
  config.logging = false
}
if(cockroachSecure && process.env.CI_PROJECT_NAME!=="hwboard2"){
  const fs = require("fs")
  config.dialectOptions = {
    ssl: {
      ca: fs.readFileSync(__dirname + '/../cockroach/certs/ca.crt').toString(),
      key: fs.readFileSync(__dirname + '/../cockroach/certs/client.'+dbUser+'.key').toString(),
      cert: fs.readFileSync(__dirname + '/../cockroach/certs/client.'+dbUser+'.crt').toString(),
    }
  }
}
const sequelize = new Sequelize(dbName,dbUser,dbPasswd,config)
sequelize.authenticate()
.then(() => {
  console.log('Connection has been established successfully.')
})
.catch(err => {
  console.error('Unable to connect to the database:', err)
})

//Export the model creator becos we may need to create more tables later, on demand
//Should i curry this?
const Homework = require("./Homework")(sequelize, Sequelize)

//We can export the created model cos we only need one
const Channels = require("./Channels")(sequelize, Sequelize)


module.exports = {sequelize,Sequelize,Homework,Channels}
