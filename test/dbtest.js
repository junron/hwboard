const chai = require("chai")
const mocha = require("mocha")
const expect = chai.expect
const getHomework = require("../database").getHomework
describe("database.js",function(){
   it("Should be able to get homework in the correct format",function(done){
       getHomework().then(function(homeworks){
           expect(homeworks).to.be.an("array")
           for (let homework of homeworks){
               expect(homework).to.be.an("object")
               expect(homework.id).to.be.a("number")
               expect(homework.subject).to.be.a("string")
               expect(homework.dueDate).to.be.a("number")
               expect(homework.dueDate).to.be.above(1500000000)
               expect(homework.isTest).to.be.a("number")//or boolean
               expect(homework.lastEditPerson).to.be.a("string")
               expect(homework.lastEditTime).to.be.a("string")
               expect(homework.text).to.be.a("string")
           }
           done()
       })
   })
})