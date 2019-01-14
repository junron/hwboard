module.exports = (sequelize, Sequelize) => {
    return sequelize.define('users', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        calendarToken: {
            type: Sequelize.STRING,
            defaultValue: ""
        }
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false
    });
};