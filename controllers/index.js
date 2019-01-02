//All functions here should be async.
//If your db library return promises, they will be unwrapped automatically
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//Load models and stuffs
const {sequelize,Sequelize,Channels,Homework} = require("../models");
const {CI:testing} = require("../loadConfig");

//Prevent xss
const xss = require("xss");

//Map emails to names
const {getStudentById} = require("../students");

//Object to store hwboard channel tables
const tables = {};

//Generate tables
async function init(){
    await sequelize.sync();
    await generateHomeworkTables();
    return sequelize.sync()
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
const arrayToObject = channelArrays => {
    const result = {}
    for (const channel of channelArrays){
        result[channel.name] = channel
    }
    return result
}
const getNumTables = () => {
    return Object.keys(tables).length
}

//async filter
async function filter(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
}

const admin = require("./admin");
const homework = require("./homework");

module.exports={
    sequelize,
    getHomework:homework.getHomework,
    addHomework:homework.addHomework,
    editHomework:homework.editHomework,
    deleteHomework:homework.deleteHomework,
    init,
    getUserChannels:admin.getUserChannels,
    getHomeworkAll:homework.getHomeworkAll,
    addMember:admin.addMember,
    arrayToObject,
    removeMember:admin.removeMember,
    addSubject:admin.addSubject,
    getNumTables,
    whenHomeworkExpires:homework.whenHomeworkExpires,
    getNumHomework:homework.getNumHomework,
    removeSubject:admin.removeSubject
}