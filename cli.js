#!/usr/bin/env node


//This file is very messy.
//Please ignore it as it is only for the CLI
const gitlab = (process.env.CI_PROJECT_NAME=="hwboard2")

if(process.argv[2]+process.argv[3]=="addchannel"){
let config ={}
if(gitlab||process.argv[4]=="default"){
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
    const data = await Channels.findAll({
      where:{
        name:config.name
      },
      raw: true
    })
    if(data.length>0){
      console.log("Channel already exists. Exiting.")
      sequelize.close()
      return
    }
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
                const data = await Channels.findAll({
                  where:{
                    name:config.name
                  },
                  raw: true
                })
                if(data.length>0){
                  console.log("Channel already exists. Exiting.")
                  sequelize.close()
                  return
                }
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
}else if(process.argv[2]=="start"){
  const { spawn } = require('child_process')
console.log(process.argv)
  const detached = (process.argv[3]=="detach")
  const options = {
    detached
  }
  if(detached){
    options.stdio = ['ignore', 'ignore', 'ignore']
  }
  const server = spawn("node",["./bin/www"],options)
  if(!detached){
    server.stdout.on('data', function (data) {
      console.log(data.toString())
    })
    server.stderr.on('data', function (data) {
      console.log(data.toString())
    })
  }else{
    server.unref()
  }
}else if(process.argv[2]=="config"){
  if(gitlab){
    console.log("Please use the environment variables in CI environment")
  }else{
    console.log(`\x1b[31m
      The data you input will be stored unencrypted in ./config.json.
      Please ensure that the ./config.json file is in your .gitignore file to avoid committing sensitive data.
      Alternatively, you may decide to store passwords or other data in environment variables instead.
      To do this, type 

      skip

      when prompted for data that you would not like to store in the config.json file.
      \x1b[0m
      `)
    const readline = require('readline')
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    const config = {}
    r1.question("Do you want to automatically generate a cookie secret? (yes/no)  ",(answer)=>{
      if(answer.toLowerCase()=="yes"){
        const crypto = require("crypto")
        crypto.randomBytes(2048,function(error,buffer){
          if(error) throw error
          config.COOKIE_SECRET = buffer.toString("hex")
          console.log("Using 2048 bytes of random data: \n",config.COOKIE_SECRET)
        })
      }else{
        console.log(`Please set the HWBOARD_COOKIE_SECRET environment variable`)
      }
      r1.question("Postgresql username  ",(answer)=>{
        if(answer!="skip"){
          config.POSTGRES_USER = answer
        }else{
          console.log(`Please set the POSTGRES_USER environment variable`)
        }
        r1.question("Postgresql database  ",(answer)=>{
          if(answer!="skip"){
            config.POSTGRES_DB = answer
          }else{
            console.log(`Please set the POSTGRES_DB environment variable`)
          }
          r1.question("Postgresql password  ",(answer)=>{
            if(answer!="skip"){
              config.POSTGRES_PASSWORD = answer
            }else{
              console.log(`Please set the POSTGRES_PASSWORD environment variable`)
            }
            r1.question("Do you want to run hwboard in dev/testing mode? This will skip the authentication process. (yes/no)",(answer)=>{
              config.CI = answer=="yes"
              if(!config.CI){
                r1.question("Microsoft client id  ",(answer)=>{
                  if(answer!="skip"){
                    config.MS_CLIENTID = answer
                  }else{
                    console.log(`Please set the MS_CLIENTID environment variable`)
                  }
                  r1.question("Microsoft client secret  ",(answer)=>{
                    if(answer!="skip"){
                      config.MS_CLIENTSECRET = answer
                    }else{
                      console.log(`Please set the MS_CLIENTSECRET environment variable`)
                    }
                    r1.question("Hostname (omit protocol and path) eg nushwhboard.tk  ",(answer)=>{
                      if(answer!="skip"){
                        config.HOSTNAME = answer
                      }else{
                        console.log(`Please set the HWBOARD_HOSTNAME environment variable`)
                      }
                      r1.close()
                      const fs = require("fs")
                      fs.writeFile("./config.json",JSON.stringify(config,null,2),err=>{
                        if(err) throw err
                        console.log("Config complete")
                      })
                    })
                  })
                })
              }else{
                r1.question("Port to run hwboard on  ",(answer)=>{
                  if(answer!="skip"){
                    config.PORT = answer
                  }else{
                    console.log(`Please set the HWBOARD_PORT environment variable`)
                  }
                  r1.close()
                  const fs = require("fs")
                  fs.writeFile("./config.json",JSON.stringify(config,null,2),err=>{
                    if(err) throw err
                    console.log("Config complete")
                  })
                })
              }
            })
          })
        })
      })
    })
  }
}
