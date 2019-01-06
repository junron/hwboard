// Load variables
//Same as docker env variables 
//or use a config file
const {
  DB_PASSWORD:dbPassword,
  DB_USER:dbUser,
  DB_NAME:dbName="hwboard",
  USE_POSTGRES:psqlEnabled,
  SEQUELIZE_LOGGING:logging,
  DB_PORT:dbPort,
  COCKROACH_DB_SECURE:cockroachSecure
} = require("../loadConfig");

const psql = psqlEnabled === "true" || psqlEnabled === true;
const Sequelize = psql ? require("sequelize") : require('sequelize-cockroachdb');

if(!psql){
  //Make sequelize arrays work for cockroachDB
  //https://github.com/cockroachdb/sequelize-cockroachdb/issues/26
  Sequelize.ARRAY.prototype._stringify = function _stringify(values, options) {
    let str = 'ARRAY[' + values.map(value => {
      if (this.type && this.type.stringify) {
        value = this.type.stringify(value, options);

        if (this.type.escape === false) {
          return value;
        }
      }
      return options.escape(value);
    }, this).join(',') + ']';

    if (this.type) {
      const Utils = require('sequelize/lib/utils');
      let castKey = this.toSql();

      if (this.type instanceof Sequelize.ENUM) {
        castKey = Utils.addTicks(
          Utils.generateEnumName(options.field.Model.getTableName(), options.field.fieldName),
          '"'
        ) + '[]';
      }
      //3 colons instead of 2
      str += ':::' + castKey;
    }

    return str;
  };
}



let DB_HOST = "localhost";
//In docker, cockroachDB is on `cockroachdb` and not `localhost`
//Cos db container is called cockroachdb
//https://forums.docker.com/t/cant-get-postgres-to-work/29580/4
if(process.env.CI_PROJECT_NAME=="hwboard2" || process.env.IS_DOCKER=="true"){
  DB_HOST = psql ? "postgres" : "cockroachdb";
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
if(!psql && cockroachSecure && process.env.CI_PROJECT_NAME!=="hwboard2"){
  const fs = require("fs");
  config.dialectOptions = {
    ssl: {
      ca: fs.readFileSync(__dirname + '/../cockroach/certs/ca.crt').toString(),
      key: fs.readFileSync(__dirname + '/../cockroach/certs/client.'+dbUser+'.key').toString(),
      cert: fs.readFileSync(__dirname + '/../cockroach/certs/client.'+dbUser+'.crt').toString(),
    }
  };
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

const Users = require("./Users")(sequelize, Sequelize);


module.exports = {sequelize,Sequelize,Homework,Channels,Users};
