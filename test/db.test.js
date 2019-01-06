const chai = require("chai");
chai.use(require('chai-uuid'));
const expect = chai.expect;
const channels = {testing:{
  name: 'testing',
  permissions: 3 }};
const {getHomeworkAll,init,addHomework} = require("../controllers");
describe("database.js",function(){
  before(function(){
    return init();
  });
  it("Should be able to get homework in the correct format",function(done){
    getHomeworkAll(channels).then(function(homeworks){
      expect(homeworks).to.be.an("array");
      if(homeworks.length<1){
        console.log("\033[0;31m There is no homework to check format.\033[0m");
      }
      for (let homework of homeworks){
        expect(homework).to.be.an("object");
        expect(homework.id).to.be.a.uuid('v4');
        expect(homework.subject).to.be.a("string");
        let dueDateNum = new Date(homework.dueDate).getTime();
        expect(dueDateNum).to.be.a("number");
        expect(dueDateNum).to.be.above(1500000000);
        expect(homework.isTest).to.be.a("boolean");
        expect(homework.lastEditPerson).to.be.a("string");
        expect(homework.lastEditTime).to.be.a.instanceof(Date);
        expect(homework.text).to.be.a("string");
      }
      done();
    }).catch(function(err){
      console.log(err);
    });
  });
  it("Should escape HTML special characters",async function(){
    const payload = {
      "text":"<script>alert('helloworld')</script>",
      //Subject can be anything
      //Not restricted yet
      subject:"XSSTest",
      isTest:true,
      dueDate:new Date().getTime()+100000,
      lastEditPerson:"tester@nushigh.edu.sg",
      tags:['Optional'],
      token:"bleh"
    };
    await addHomework("testing",payload);
    const homeworks = await getHomeworkAll(channels);
    expect(homeworks).to.be.an("array");
    for (let homework of homeworks){
      if(homework.subject==="XSSTest"){
        expect(homework.text).to.equal("&lt;script&gt;alert('helloworld')&lt;/script&gt;");
      }
    }
  });
  it("Should parameterize queries",async function(){
    //INSERT INTO "homework" ("id","text","subject","dueDate","isTest","lastEditPerson","lastEditTime") VALUES (DEFAULT,'Add homework test'--,'Math','2018-05-24 10:00:00.000 +00:00',true,'tester@nushigh.edu.sg','2018-05-23 05:05:04.327 +00:00') RETURNING *;
    const payload = {
      "text":"helloword',(select version()))--",
      //Subject can be anything
      //Not restricted yet
      subject:"SQLInjectionTest",
      isTest:true,
      dueDate:new Date().getTime()+100000,
      lastEditPerson:"tester@nushigh.edu.sg",
      tags:['Optional'],
      token:"bleh"
    };
    await addHomework("testing",payload);
    const homeworks = await getHomeworkAll(channels);
    expect(homeworks).to.be.an("array");
    for (let homework of homeworks){
      if(homework.subject==="SQLInjectionTest"){
        expect(homework.text).to.equal(payload.text);
      }
    }
  });
});