//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
const Sequelize = require('sequelize')
//Prevent xss
const xss = require('xss')
//Same as docker env variables 
//or use a config file
const config = require("./loadConfig")
const {POSTGRES_PASSWORD:dbPasswd,POSTGRES_USER:dbUser,POSTGRES_DB:dbName="hwboard"} = config
let POSTGRES_HOST = "localhost"
if(process.env.CI_PROJECT_NAME=="hwboard2"){
  POSTGRES_HOST = "postgres"
}
const sequelize = new Sequelize(`postgres://${dbUser}:${dbPasswd}@${POSTGRES_HOST}:5432/${dbName}`)
sequelize.authenticate()
.then(() => {
  console.log('Connection has been established successfully.');
})
.catch(err => {
  console.error('Unable to connect to the database:', err);
});
const Homework = sequelize.define('homework', {
  id :{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  text: {
    type: Sequelize.STRING
  },
  subject: {
    type: Sequelize.STRING
  },
  dueDate: {
    type: Sequelize.DATE
  },
  isTest: {
    type: Sequelize.BOOLEAN
  },
  lastEditPerson: {
    type: Sequelize.STRING
  },
  lastEditTime: {
    type: Sequelize.DATE
  }
},{
  timestamps:true,
  createdAt: false,
  updatedAt: 'lastEditTime'
})

async function init(){
  return Homework.sync()
}
async function getHomework(removeExpired=true){
  const data = await Homework.findAll({
    raw: true
  })
  if(removeExpired){
    return data.filter((homework)=>{
      return homework.dueDate >= new Date().getTime()
    })
  }else{
    return data
  }
}

async function addHomework(newHomework){
  newHomework = await removeXss(newHomework)
  return Homework.create(newHomework)
}

async function editHomework(newHomework){
  newHomework = await removeXss(newHomework)
  Homework.update(newHomework,
    {
    where:{
      id:newHomework.id
    }
  })
}
async function deleteHomework(homeworkId){
  Homework.destroy(
    {
    where:{
      id:homeworkId
    }
  })
}
//Mitigate XSS
async function removeXss(object){
  for (let property in object){
    if(typeof object[property]=="string"){
      object[property] = xss(object[property])
    }
  }
  return object
}
module.exports={getHomework,addHomework,editHomework,deleteHomework,init}
