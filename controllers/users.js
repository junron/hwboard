const xss = require("xss");
const {Sequelize,Users} = require("../models");

async function getUsers() {
    return await Users.findAll({
        raw: true
    });
}

async function getUserTokens() {
    return await Users.findAll({
      raw: true,
      where: {
        calendarToken: {
          [Sequelize.Op.ne]: ""
        }
      }
    });
}

async function addUser(name, email, token) {
    const data = {
        name: name,
        email: email,
        calendarToken: token
    };
    return await Users.create(data);
}

async function removeUser(name, email) {
    return await Users.delete({
        where: {
            name: { [Sequelize.Op.eq]: name },
            email: { [Sequelize.Op.eq]: email }
        }
    })
}

module.exports = {
    getUsers,
    getUserTokens,
    addUser,
    removeUser
};