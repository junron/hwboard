#!/usr/bin/env node
function promisifyAll(moduleObj) {
  const {promisify} = require('util');
  for(const thing in moduleObj){
    if(typeof moduleObj[thing]==="function"){
      moduleObj[thing] = promisify(moduleObj[thing]);
    }
  }
  return moduleObj;
}

function decryptData(password){
  var fs = require('fs');
  const crypto = require("crypto");
  var decrypt = crypto.createDecipher("aes-256-cbc", password);
  var output = fs.createWriteStream("data.json");
  const input = fs.createReadStream("data.json.enc");
  input
    .pipe(decrypt)
    .pipe(output);
}

function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-";
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

//This file is very messy.
//Please ignore it as it is only for the CLI
const gitlab = (process.env.CI_PROJECT_NAME=="hwboard2");
if(process.argv[2]==="restore"){
  (async ()=>{
    const fileName = process.argv[3];
    const {sequelize,Channels} = require("./models");
    await sequelize.sync();
    const {addHomework,init} = require("./controllers");
    await init();
    const fs  = require("fs");
    const json = JSON.parse(fs.readFileSync(fileName,'utf-8'));
    const {
      homework,
      channelsRaw:channels
    } = json;
    const existingChannels = (await Channels.findAll({raw: true})).map(channel=>channel.name);
    for(const channel of channels){
      if(!channel.tags){
        channel.tags =  {
          "Graded" : "red",
          "Optional" : "green"
        };
      }
      channel.id = uuid();
      try{
        if(existingChannels.includes(channel.name)){
          console.log(`Channel ${channel.name} already exists`);
          continue;
        }
        await Channels.create(channel);
      }catch(e){
        console.log(channel);
        console.log(e);
      }
    }
    await init();
    for (const hw of homework){
      const {channel} = hw;
      if(!hw.tags){
        if(hw.isTest){
          hw.tags = ["Graded"];
        }else{
          hw.tags = [];
        }
      }
      hw.id = uuid();
      try{
        await addHomework(channel,hw);
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
    await init();
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
}else if(process.argv[2]==="cockroach"){
  if(process.argv[3]==="config"){
    (async ()=>{
      const {promisify} = require("util");
      const fs  = promisifyAll(require('fs'));
      const readline = require('readline');
      readline.Interface.prototype.question[promisify.custom] = function(prompt) {
        return new Promise(resolve =>
          readline.Interface.prototype.question.call(this, prompt, resolve),
        );
      };
      readline.Interface.prototype.questionAsync = promisify(
        readline.Interface.prototype.question,
      );
      const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const options = {};
      options.secure = (await r1.questionAsync("Secure cluster? (Y/n) "))!=="n";
      options.nodes = [];
      const port = parseInt(await r1.questionAsync("Node port number:  "));
      const httpPort = parseInt(await r1.questionAsync("HTTP port number:  "));
      const exposeHTTP = (await r1.questionAsync("Do you want to expose the HTTP port? (Y/n) "))!=="n";
      options.nodes[0] = {
        nodePort:port
      };
      const joinOther = (await r1.questionAsync("Do you want to join other nodes? (Y/n) "))!=="n";
      while (joinOther){
        const thisNodeOptions = {};
        const nodePort = parseInt(await r1.questionAsync("Node port number:  "));
        const isRemote = (await r1.questionAsync("Is this node on another machine? (Y/n) "))!=="n";
        if(isRemote){
          const sshHost = await r1.questionAsync("Remote ssh host (eg ssh.somedomain.com) ");
          const sshUser = await r1.questionAsync("Remote ssh user (eg johnny) ");
          const sshKeyfile = await r1.questionAsync("Private key file path for user "+sshUser+" (eg ~/.ssh/id_rsa) ");
          thisNodeOptions.nodeHost = sshHost;
          thisNodeOptions.connectionCommand = `ssh ${sshUser}@${sshHost} -i ${sshKeyfile} -L 0.0.0.0:${nodePort}:localhost:${nodePort}`;
        }
        thisNodeOptions.nodePort = nodePort;
        options.nodes[options.nodes.length] = thisNodeOptions;
        const isContinue = (await r1.questionAsync("Do you want to add another node? (Y/n) "))!=="n";
        console.log("\n");
        if(!isContinue){
          break;
        }
      }
      const sshTunnelInit = options.nodes.reduce((prev,curr)=>{
        if(curr.connectionCommand!==undefined){
          return prev + curr.connectionCommand + ";";
        }
        return prev;
      },"");

      let openUFWPorts = "sudo ufw allow proto tcp from 172.16.0.0/12 to any port ";
      let base = "cockroach start -p "+port+" --http-port="+httpPort+" ";
      if(options.secure){
        base += "--certs-dir=cockroach/certs ";
      }else{
        base += "--insecure";
      }
      base += "--join=";
      const cockroachInit = options.nodes.reduce((prev,curr)=>{
        const {nodePort} = curr;
        openUFWPorts+=nodePort + ",";
        if(curr.connectionCommand===undefined){
          return prev;
        }
        return prev + "host.docker.internal:"+nodePort+",";
      },base);
      const shebang = `#!/usr/bin/env bash
      `;
      const runForever = " --advertise-host host.docker.internal";
      if(openUFWPorts.slice(-1)==","){
        openUFWPorts = openUFWPorts.slice(0,-1);
      }
      openUFWPorts+=";";
      const setHostDockerInternal = 'echo -e "`/sbin/ip route|awk \'/default/ { print $3 }\'`\thost.docker.internal" | tee -a /etc/hosts > /dev/null;';
      const writeSSHTunnel = fs.writeFile("cockroach/ssh-tunnel-init.sh",shebang+openUFWPorts+sshTunnelInit);
      const writeRunFile = fs.writeFile("cockroach/run.sh",shebang+setHostDockerInternal+cockroachInit+runForever);
      const readDockerCompose = fs.readFile("./.env","utf-8");
      const readConfig = fs.readFile("./config.json","utf-8");

      let [dockerCompose,config] = await Promise.all([readDockerCompose,readConfig,writeSSHTunnel,writeRunFile]);
      config = JSON.parse(config);
      config.COCKROACH_DB_SECURE = options.secure;
      config.COCKROACH_DB_PORT = port;
      dockerCompose = dockerCompose.split("\n");
      dockerCompose[1]=`COCKROACHDB_PORT=${port}`;
      if(exposeHTTP){
        dockerCompose[2] = `COCKROACH_DB_EXPOSE_HTTP_PORT=${httpPort}:${httpPort}`;
      }else{
        dockerCompose[2] = "COCKROACH_DB_EXPOSE_HTTP_PORT=";
      }
      dockerCompose = dockerCompose.join("\n");
      const chmodFiles = [fs.chmod("cockroach/run.sh",0o755),fs.chmod("cockroach/ssh-tunnel-init.sh",0o755)];
      await [...chmodFiles,fs.writeFile(".env",dockerCompose),fs.writeFile("./config.json",JSON.stringify(config,null,2))];
      r1.close();
      console.log(`
      
      Config complete.

      ======= SSH tunnel =======
      Run \`./cockroach/ssh-tunnel-init.sh\` to create ssh tunnels.
      Run \`screen ./cockroach/ssh-tunnel-init.sh\` to run the tunnel in a screen session.
      Press Ctrl-d then Ctrl-a to detach from the screen session

      ======= CockroachDB =======
      Run \`./cockroach/run.sh\` to start the cockroachdb node.
      Run \`./cockroach/run.sh --background\` to start the cockroachdb node in the background.
      If running in the background, please consider using Docker instead.
      `);
    })();
  }else if(process.argv[3]==="create-ca"){
    (async ()=>{
      const {promisify} = require('util');
      const execFile  = promisify(require('child_process').execFile);
      const mkdir = promisify(require('fs').mkdir);
      try{
        await Promise.all([mkdir("cockroach/certs"),mkdir("cockroach/ca-key")]);
      }catch(e){
        //
      }
      await execFile("cockroach",["cert","create-ca","--certs-dir=cockroach/certs","--ca-key=cockroach/ca-key/ca.key","--key-size=4096"]);
      console.log("CA key generated in `./cockroach/ca-key/ca.key`.");
      console.log("CA cert generated in `./cockroach/certs/ca.crt`.");
      console.log("\n\n");
      console.log("Encrypting CA key.");
      console.log("You need to decrypt it if you want to use it.");
      console.log("Do not enter a passphrase if you do not want to encrypt the CA key.");
      console.log("Use the `ssh-keygen -p -f ./cockroach/ca-key/ca.key` command to change the passphrase/decrypt the key.\n\n");
      await execFile("ssh-keygen",[ "-p", "-f", "./cockroach/ca-key/ca.key"]);
    })();
  }else if(process.argv[3]==="create-node"){
    (async ()=>{
      const {promisify} = require('util');
      const execFile  = promisify(require('child_process').execFile);
      await execFile("cockroach",["cert","create-node","localhost","host.docker.internal","--certs-dir=cockroach/certs","--ca-key=cockroach/ca-key/ca.key","--key-size=4096"]);
      console.log("Node key generated in `./cockroach/certs/node.key`.");
      console.log("Node cert generated in `./cockroach/certs/node.crt`.");
      console.log("Copy `./certs/node.key`,`./cockroach/certs/node.crt` and `./cockroach/certs/ca.crt`");
      console.log("to the target server's certs directory to start a secure node.");
    })();
  }else if(process.argv[3]==="create-client"){
    (async ()=>{
      const {promisify} = require('util');
      const execFile  = promisify(require('child_process').execFile);
      const readline = require('readline');
      const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      r1.question("Client username:  ",async name=>{
        await execFile("cockroach",["cert","create-client",name,"--certs-dir=cockroach/certs","--ca-key=cockroach/ca-key/ca.key","--key-size=4096"]);
        console.log("Client key generated in `./cockroach/certs/client."+name+".key`.");
        console.log("Client cert generated in `./cockroach/certs/client."+name+".crt`.");
        r1.close();
      });
    })();
  }
}else if(process.argv[2]==="getData"){
  const readline = require('readline');
  if(process.env.HWBOARD_DATA_PASSWORD){
    return decryptData(process.env.HWBOARD_DATA_PASSWORD);
  }
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  r1.question("Decryption key:  ",password=>{
    decryptData(password);
    r1.close();
  });
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
                  await init();
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
    const {sequelize,Channels} = require("./models");
    await Channels.destroy({
      where:{
        name:"testing"
      }
    });
    await require("./controllers").init();
    sequelize.close();
  }();

}else if(process.argv[2]==="config"){
  if(process.argv[3]==="secret-only"){
    const fs = require("fs");
    let config;
    try{
      config = JSON.parse(fs.readFileSync("./config.json"));
    }catch(e){
      config = {};
    }
    console.log(config);
    const crypto = require("crypto");
    crypto.randomBytes(32,function(error,buffer){
      if(error) throw error;
      config.COOKIE_SECRET = buffer.toString("base64");
      console.log("Using 32 bytes (256 bits) of random data: \n",config.COOKIE_SECRET);
      console.log(JSON.stringify(config,null,2));
      fs.writeFile("./config.json",JSON.stringify(config,null,2),err=>{
        if(err) throw err;
        console.log("Config complete");
      });
    });
  }else  if(process.argv[3]==="docker"){
    const util = require('util');
    const readline = require('readline');
    readline.Interface.prototype.question[util.promisify.custom] = function(prompt) {
      return new Promise(resolve =>
        readline.Interface.prototype.question.call(this, prompt, resolve),
      );
    };
    readline.Interface.prototype.questionAsync = util.promisify(
      readline.Interface.prototype.question,
    );
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const config = {}
        ;(async ()=>{
      const crypto = require("crypto");
      const secret = (await crypto.randomBytes(32)).toString("base64");
      config.COOKIE_SECRET = secret;
      console.log("Using 32 bytes (256 bits) of random data for cookie secret: \n",config.COOKIE_SECRET);
      console.log();
      const hostname = await r1.questionAsync("Hostname (omit protocol and path) eg nushwhboard.tk: ",);
      if(hostname!=="skip"){
        config.HOSTNAME = hostname;
      }else{
        console.log(`Please set the HWBOARD_HOSTNAME environment variable`);
      }
      const ci = await r1.questionAsync("\nDo you want to run hwboard in dev/testing mode? This will skip the authentication process. (yes/no):  ");
      config.CI = ci==="yes";
      if(!config.CI){
        const clientId = await r1.questionAsync("\nMicrosoft client id:  ");
        if(clientId!=="skip"){
          config.MS_CLIENTID = clientId;
        }else{
          console.log(`Please set the MS_CLIENTID environment variable`);
        }
        const clientSecret = await r1.questionAsync("\nMicrosoft client secret:  ");
        if(clientSecret!=="skip"){
          config.MS_CLIENTSECRET = clientSecret;
        }else{
          console.log(`Please set the MS_CLIENTSECRET environment variable`);
        }
      }
      const port = await r1.questionAsync("\nPort to run hwboard on:  ");
      if(port!=="skip"){
        config.PORT = port;
      }else{
        console.log(`Please set the HWBOARD_PORT environment variable`);
      }
    })()
      .then(async ()=>{
        r1.close();
        const fs = require("fs");
        const writeFile = util.promisify(fs.writeFile);
        const readFile = util.promisify(fs.readFile);
        const writeConfig = writeFile("./config.json",JSON.stringify(config,null,2));
        const readDockerCompose = readFile("./docker-compose.yml","utf-8");
        let [dockerCompose] = await Promise.all([readDockerCompose,writeConfig]);
        dockerCompose = dockerCompose.replace(`3001:3001`,`${config.PORT}:${config.PORT}`);
        await writeFile("./docker-compose.yml",dockerCompose);
        console.log("Config complete");
        console.log("Run `docker-compose up` to build images and start a container");
        console.log("Check the documentation to find out how to add channels and start hwboard.");
      })
      .catch((e)=>{
        console.log(e);
        r1.close();
        throw e;
      });
  }else{
    console.log(`\x1b[31m
      The data you input will be stored unencrypted in ./config.json.
      Please ensure that the ./config.json file is in your .gitignore file to avoid committing sensitive data.
      Alternatively, you may decide to store passwords or other data in environment variables instead.
      To do this, type 

      skip

      when prompted for data that you would not like to store in the config.json file.
      \x1b[0m
      `);
    const readline = require('readline');
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const config = {};
    r1.question("Do you want to automatically generate a cookie secret? (yes/no)  ",async (answer)=>{
      if(answer.toLowerCase()==="yes"){
        const crypto = require("crypto");
        const secret = (await crypto.randomBytes(32)).toString("base64");
        config.COOKIE_SECRET = secret;
        console.log("Using 32 bytes (256 bits) of random data: \n",config.COOKIE_SECRET);
      }else{
        console.log(`Please set the HWBOARD_COOKIE_SECRET environment variable`);
      }
      r1.question("Database username  ",(answer)=>{
        if(answer!="skip"){
          config.DB_USER = answer;
        }else{
          console.log(`Please set the DB_USER environment variable`);
        }
        r1.question("Database  name  ",(answer)=>{
          if(answer!="skip"){
            config.DB_AME = answer;
          }else{
            console.log(`Please set the DB_NAME environment variable`);
          }
          r1.question("Database password  ",(answer)=>{
            if(answer!=="skip"){
              config.DB_PASSWORD = answer;
            }else{
              console.log(`Please set the DB_PASSWORD environment variable`);
            }
            r1.question("Do you want to run hwboard in dev/testing mode? This will skip the authentication process. (yes/no)",(answer)=>{
              config.CI = answer==="yes";
              if(!config.CI){
                r1.question("Microsoft client id  ",(answer)=>{
                  if(answer!=="skip"){
                    config.MS_CLIENTID = answer;
                  }else{
                    console.log(`Please set the MS_CLIENTID environment variable`);
                  }
                  r1.question("Microsoft client secret  ",(answer)=>{
                    if(answer!=="skip"){
                      config.MS_CLIENTSECRET = answer;
                    }else{
                      console.log(`Please set the MS_CLIENTSECRET environment variable`);
                    }
                    r1.question("Hostname (omit protocol and path) eg nushwhboard.tk  ",(answer)=>{
                      if(answer!=="skip"){
                        config.HOSTNAME = answer;
                      }else{
                        console.log(`Please set the HWBOARD_HOSTNAME environment variable`);
                      }
                      r1.close();
                      const fs = require("fs");
                      fs.writeFile("./config.json",JSON.stringify(config,null,2),err=>{
                        if(err) throw err;
                        console.log("Config complete");
                      });
                    });
                  });
                });
              }else{
                r1.question("Port to run hwboard on  ",(answer)=>{
                  if(answer!="skip"){
                    config.PORT = answer;
                  }else{
                    console.log(`Please set the HWBOARD_PORT environment variable`);
                  }
                  r1.close();
                  const fs = require("fs");
                  fs.writeFile("./config.json",JSON.stringify(config,null,2),err=>{
                    if(err) throw err;
                    console.log("Config complete");
                  });
                });
              }
            });
          });
        });
      });
    });
  }
}else{
  console.log(`
  
  
  Command invalid
  
  
  
  
  `);
  process.exit(1);
}
