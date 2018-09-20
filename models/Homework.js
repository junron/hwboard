module.exports = (sequelize, Sequelize,name) => {
  console.log('homework-'+name)
  const Homework = sequelize.define('homework-'+name, {
    id :{
      type: Sequelize.INTEGER,
      autoIncrement: true,
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
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    lastEditPerson: {
      type: Sequelize.STRING
    },
    lastEditTime: {
      type: Sequelize.DATE
    }
  },{
    freezeTableName: true,
    timestamps:true,
    createdAt: false,
    updatedAt: 'lastEditTime'
  })
  return Homework
}