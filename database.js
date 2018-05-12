//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
const Sequelize = require('sequelize')

//Same as docker env variables
const dbPasswd = process.env.POSTGRES_PASSWORD
const dbUser = process.env.POSTGRES_USER 
const dbName = process.env.POSTGRES_DB || "hwboard"

const sequelize = new Sequelize(`postgres://${dbUser}:${dbPasswd}@127.0.0.1:5432/${dbName}`)
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
Homework.sync().then(()=>{
  console.log("Table init complete")
}).catch(function(err){
  console.log(err)
})

async function getHomework(){
  const data = await Homework.findAll({
    raw: true
  })
  return data.filter((homework)=>{
    return homework.dueDate >= new Date().getTime()
  })
}

async function addHomework(newHomework){
  return Homework.create(newHomework)
}

async function editHomework(newHomework){
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
module.exports={getHomework,addHomework,editHomework,deleteHomework}