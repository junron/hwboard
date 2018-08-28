module.exports = (sequelize, Sequelize) => {
    return sequelize.define('channels', {
      id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true
      },
      name: {
          type: Sequelize.STRING
      },
      subjects: {
          type: Sequelize.ARRAY(Sequelize.STRING)
      },
      timetable: {
          type: Sequelize.JSON
      },
      roots: {
          type: Sequelize.ARRAY(Sequelize.STRING)
      },
      admins: {
          type: Sequelize.ARRAY(Sequelize.STRING)
      },
      members: {
          type: Sequelize.ARRAY(Sequelize.STRING)
      },
  }, {
      timestamps: true,
      createdAt: false,
      updatedAt: 'lastEditTime'
  })
};