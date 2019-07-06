// Load variables
//Same as docker env variables 
//or use a config file
const {
  DB_PASSWORD:dbPassword,
  DB_USER:dbUser,
  DB_NAME:dbName="hwboard",
  SEQUELIZE_LOGGING:logging,
  DB_PORT:dbPort,
} = require("../loadConfig");

const Sequelize = require("sequelize");

let DB_HOST = "localhost";
//https://forums.docker.com/t/cant-get-postgres-to-work/29580/4
if(process.env.CI_PROJECT_NAME=="hwboard2" || process.env.IS_DOCKER=="true"){
  DB_HOST = "postgres";
}

const config = {
  host:DB_HOST,
  port:dbPort,
  dialect: "postgres",
  operatorsAliases: Sequelize.Op
};
console.log({logging});
if(logging===false){
  config.logging = false;
}
const sequelize = new Sequelize(dbName,dbUser,dbPassword,config);
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

//Export the model creator because we may need to create more tables later, on demand
//Should i curry this?
const Homework = require("./Homework")(sequelize, Sequelize);

//We can export the created model cos we only need one
const Channels = require("./Channels")(sequelize, Sequelize);


module.exports = {sequelize,Sequelize,Homework,Channels};
