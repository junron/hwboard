module.exports = (sequelize, Sequelize) => {
  return name =>{
    console.log('homework-'+name);
    const Homework = sequelize.define('homework-'+name, {
      id :{
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      isTest:{
        type:Sequelize.BOOLEAN
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
    });
    return Homework;
  };
};
