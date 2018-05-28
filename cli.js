#!/usr/bin/env node
const gitlab = (process.env.CI_PROJECT_NAME=="hwboard2")


let config ={}
if(gitlab){
  config = {
    name:"testing",
    subjects:["math","chemistry"],
    roots:["tester@nushigh.edu.sg"],
    admins:[],
    members:[]
  }
  console.log("Using config:")
  console.log(config)
  ;(async()=>{
    const {sequelize,Channels} = require("./models")
    await sequelize.sync()
    await Channels.create(config)
    console.log("channel created")
    sequelize.close()
  })()
}else{
  const readline = require('readline')
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  r1.question("Channel name: (testing)  ",(answer="testing")=>{
    if(answer==""){
      answer ="testing"
    }
    config.name = answer
    r1.question("Subjects (seperate with comma): (math,chemistry)  ",(answer="math,chemistry")=>{
      if(answer==""){
        answer ="math,chemistry"
      }
      config.subjects = answer.split(",")
      r1.question("Root users (seperate with comma): (tester@nushigh.edu.sg)  ",(answer="tester@nushigh.edu.sg")=>{
        if(answer==""){
          answer ="tester@nushigh.edu.sg"
        }
        config.roots = answer.split(",")
        r1.question("Admin users (seperate with comma): ()  ",(answer)=>{
          if(answer==""){
            config.admins = []
          }else{
            config.admins = answer.split(",")
          }
          r1.question("Normal users (seperate with comma): (*)  ",(answer="*")=>{
            if(answer==""){
              answer ="*"
            }
            config.members = answer.split(",")
            console.log(config)
            r1.question("Is this okay? (Yes/no)  ",async answer=>{
              if(answer.toLowerCase()=="yes"){
                const {sequelize,Channels} = require("./models")
                await sequelize.sync()
                await Channels.create(config)
                console.log("channel created")
                sequelize.close()
                r1.close()
              }else{
                console.log("operation cancelled")
                r1.close()
              }
            })
          })
        })
      })
    })
  })
}