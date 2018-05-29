const Sequelize = require('sequelize')
//Same as docker env variables 
//or use a config file
const config = require("../loadConfig")
const {POSTGRES_PASSWORD:dbPasswd,POSTGRES_USER:dbUser,POSTGRES_DB:dbName="hwboard"} = config
let POSTGRES_HOST = "localhost"
if(process.env.CI_PROJECT_NAME=="hwboard2"||process.env.IS_DOCKER=="true"){
  POSTGRES_HOST = "postgres"
}
const sequelize = new Sequelize(`postgres://${dbUser}:${dbPasswd}@${POSTGRES_HOST}:5432/${dbName}`)
sequelize.authenticate()
.then(() => {
  console.log('Connection has been established successfully.')
})
.catch(err => {
  console.error('Unable to connect to the database:', err)
})

//Export the model creator becos we may need to create tables later
const Homework = require("./Homework")
//We can export the created model cos we only need one
const Channels = require("./Channels")(sequelize, Sequelize)


module.exports = {sequelize,Sequelize,Homework,Channels}
