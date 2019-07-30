#!/usr/bin/env node

const uuid = require("uuid");
function promisifyAll(moduleObj) {
  const {promisify} = require('util');
  for(const thing in moduleObj){
    if(typeof moduleObj[thing]==="function"){
      moduleObj[thing] = promisify(moduleObj[thing]);
    }
  }
  return moduleObj;
}

//This file is very messy.
//Please ignore it as it is only for the CLI
const gitlab = (process.env.CI_PROJECT_NAME=="hwboard2");
if(process.argv[2]==="restore"){
  (async ()=>{
    const {DB_USER:dbUser} = require("./loadConfig");
    const fileName = process.argv[3];
    const force = process.argv[4] === "force";
    const {sequelize,Channels} = require("./models");
    if(force){
      console.log("Force specified");
      console.log("Dropping all tables...");
      await sequelize.query("drop owned by "+dbUser+" cascade;");
    }
    await sequelize.sync();
    const {addHomework,init} = require("./controllers");
    await init(false);
    const fs  = require("fs");
    const json = JSON.parse(fs.readFileSync(fileName,'utf-8'));
    const {
      homework,
      channelsRaw:channels
    } = json;
    const existingChannels = (await Channels.findAll({raw: true})).map(channel=>channel.name);
    const newChannels = [...existingChannels];
    for(const channel of channels){
      if(!channel.tags){
        channel.tags =  {
          "Graded" : "red",
          "Optional" : "green"
        };
      }
      channel.id = channel.id || uuid();
      try{
        if(existingChannels.includes(channel.name)){
          console.log(`Channel ${channel.name} already exists`);
        }else{
          console.log(`Created channel ${channel.name}.`);
          await Channels.create(channel);
          newChannels.push(channel.name);
        }
      }catch(e){
        console.log(channel);
        console.log(e);
      }
    }
    await init(false);
    for (const hw of homework){
      const {channel} = hw;
      if(!hw.tags){
        if(hw.isTest){
          hw.tags = ["Graded"];
        }else{
          hw.tags = [];
        }
      }
      hw.id = hw.id || uuid();
      try{
        if(!newChannels.includes(channel)){
          console.log(`Channel ${channel} does not exist. Skipping.`);
        }else{
          await addHomework(channel,hw);
        }
      }catch(e){
        console.log(hw);
        console.log(e);
      }
    }
    console.log("Restore complete");
    sequelize.close();
  })();
}else if(process.argv[2]==="backup"){
  (async ()=>{
    const fileName = process.argv[3];
    const {sequelize} = require("./models");
    await sequelize.sync();
    const {getHomeworkAll,getUserChannels,init} = require("./controllers");
    await init(false);
    const fs  = require("fs");
    const channelsRaw = await getUserChannels("*");
    let channels = {};
    for (const channel of channelsRaw){
      channels[channel.name] = channel;
    }
    const homework = await getHomeworkAll(channels,false);
    const json = {
      homework,
      channelsRaw
    };
    fs.writeFileSync(fileName,JSON.stringify(json,null,2));
    console.log("Backup complete");
    sequelize.close();
  })();
}else if(process.argv[2]==="clear-old"){
  (async ()=>{
    const dirName = process.argv[3];
    const fs  = promisifyAll(require('fs'));
    const path = require("path");
    const files = await fs.readdir(dirName);
    const deletes = [];
    for(const file of files){
      const date = new Date(file.split("backup-")[1].split(".json")[0].replace("_"," "));
      if(date.getHours()!==0){
        if((new Date() - date.getTime())>2.592e+8){
          deletes.push(path.resolve(__dirname,dirName,file));
        }
      }
    }
    await Promise.all(deletes.map(name=>fs.unlink(name)));
    console.log("Cleared "+deletes.length+" old backup(s)");
  })();
}else if(process.argv[2]+process.argv[3]==="addchannel"){
  let config ={
    tags : {
      "Graded" : "red",
      "Optional" : "green"
    }
  };
  if(gitlab||process.argv[4]=="default"){
    config = {
      name:"testing",
      subjects:["math","chemistry"],
      roots:["tester@nushigh.edu.sg"],
      admins:[],
      members:[],
      tags : {
        "Graded" : "red",
        "Optional" : "green"
      }
    };
    console.log("Using config:");
    console.log(config)
    ;(async()=>{
      const {sequelize,Channels} = require("./models");
      await sequelize.sync();
      const data = await Channels.findAll({
        where:{
          name:config.name
        },
        raw: true
      });
      if(data.length>0){
        console.log("Channel already exists. Exiting.");
        sequelize.close();
        return;
      }
      await Channels.create(config);
      console.log("channel created");
      sequelize.close();
    })();
  }else{
    const notEmpty = string => string.length > 0;
    const readline = require('readline');
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    r1.question("Channel name: (testing)  ",(answer="testing")=>{
      if(answer==""){
        answer ="testing";
      }
      config.name = answer;
      r1.question("Subjects (seperate with comma): ()  ",(answer)=>{
        config.subjects = answer.split(",").filter(notEmpty);
        if(config.subjects.length==0){
          config.subjects = [];
        }
        r1.question("Root users (seperate with comma): (h1710074@nushigh.edu.sg)  ",(answer="h1710074@nushigh.edu.sg")=>{
          if(answer==""){
            answer = "h1710074@nushigh.edu.sg";
          }
          config.roots = answer.split(",");
          r1.question("Admin users (seperate with comma): ()  ",(answer)=>{
            config.admins = answer.split(",");
            r1.question("Normal users (seperate with comma): ()  ",(answer="*")=>{
              config.members = answer.split(",").filter(notEmpty);
              console.log(config);
              r1.question("Is this okay? (Yes/no)  ",async answer=>{
                if(answer.toLowerCase()=="yes"){
                  const {init} = require("./controllers");
                  const {sequelize,Channels} = require("./models");
                  await sequelize.sync();
                  const data = await Channels.findAll({
                    where:{
                      name:config.name
                    },
                    raw: true
                  });
                  if(data.length>0){
                    console.log("Channel already exists. Exiting.");
                    sequelize.close();
                    return;
                  }
                  await Channels.create(config);
                  await init(false);
                  console.log("channel created");
                  sequelize.close();
                  r1.close();
                }else{
                  console.log("operation cancelled");
                  r1.close();
                }
              });
            });
          });
        });
      });
    });
  }
}else if(process.argv[2]==="reset-db-for-test"){
  void async function (){
    await require("./controllers").init(false);
    const {sequelize,Channels} = require("./models");
    await Channels.destroy({
      where:{
        name:"testing"
      }
    });
    await require("./controllers").init(false);
    sequelize.close();
  }()
    .catch(e=>{
      console.log(e);
    });
}else{
  console.log(`
  
  
  Command invalid
  
  
  
  
  `);
  process.exit(1);
}
