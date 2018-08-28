module.exports = (sequelize, Sequelize,name) => {
  console.log('homework-'+name);
    return sequelize.define('homework-' + name, {
      id: {
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
  }, {
      freezeTableName: true,
      timestamps: true,
      createdAt: false,
      updatedAt: 'lastEditTime'
  })
};