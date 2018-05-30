module.exports = (sequelize, Sequelize) => {
  const Channels = sequelize.define('channels', {
    id :{
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
    roots: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    admins: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
    members: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    },
  },{
    timestamps:true,
    createdAt: false,
    updatedAt: 'lastEditTime'
  })
  return Channels
}