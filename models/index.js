const Sequelize = require('sequelize-cockroachdb');

//Same as docker env variables 
//or use a config file
const {POSTGRES_PASSWORD:dbPasswd,POSTGRES_USER:dbUser,POSTGRES_DB:dbName="hwboard",SEQUELIZE_LOGGING:logging} = require("../loadConfig")


let POSTGRES_HOST = "localhost"
//In gitlab and docker, postgres is on `postgres` and not `localhost`
//Cos db container is called postgres
//https://forums.docker.com/t/cant-get-postgres-to-work/29580/4
if(process.env.CI_PROJECT_NAME=="hwboard2"||process.env.IS_DOCKER=="true"){
  POSTGRES_HOST = "postgres"
}

const config = {
  host:POSTGRES_HOST,
  port:26257,
  dialect: "postgres",
  operatorsAliases: Sequelize.Op
}
console.log(logging)
if(logging===false){
  config.logging = false
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
