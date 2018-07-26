  channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]


  function getChannelData(){
    const {render} = renderAdmins
    conn.emit("channelDataReq",{channel},async function(err,data){
        if(err){
        Framework7App.dialog.alert(err.toString())
        throw new Error(err)
        }
        console.log(data)
        document.getElementById("member-list").innerHTML = await render(data)
        document.getElementById("subject-list").innerHTML = renderSubjects(data.subjects)
    })
  }
  //Db inited, can get data
  conn.on("ready",()=>{
    console.log("ready")
    getChannelData()
  })
  
  //Page loaded after db init
  conn.emit("isReady",null,res=>{
    getChannelData()
  })

  //Uncaught error that could not be handled via callback etc
  conn.on("uncaughtError",error=>{
    Framework7App.dialog.alert(error)
    throw new Error(error)
  })
  conn.on("channelData",async function(data){
    const {render} = renderAdmins
    const thisChannelData = data[channel]
    document.getElementById("member-list").innerHTML = await render(thisChannelData)
    document.getElementById("subject-list").innerHTML = renderSubjects(thisChannelData.subjects)
  })
  function deleteMember(memberElem){
    const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1]
    const memberId = memberEmail.replace("@nushigh.edu.sg","")
    Framework7App.dialog.confirm("Are you sure you want to remove "+memberEmail +"?",function(){
      conn.emit("removeMember",{channel,student:memberId},function(err){
    if(err){
     Framework7App.dialog.alert(err.toString())
     throw new Error(err)
    }
        console.log("done")
      })
    })
  }
  function promoteMember(memberElem){
    const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1]
    const memberId = memberEmail.replace("@nushigh.edu.sg","")
    Framework7App.dialog.confirm("Are you sure you want to promote " + memberEmail + "?",function(){
      conn.emit("promoteMember",{channel,student:memberId},function(err){
         if(err){
     Framework7App.dialog.alert(err.toString())
     throw new Error(err)
    }
        console.log("done")
      })
    })
  }
  function demoteMember(memberElem){
    const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1]
    const memberId = memberEmail.replace("@nushigh.edu.sg","")
    Framework7App.dialog.confirm("Are you sure you want to demote " + memberEmail + "?",function(){
      conn.emit("demoteMember",{channel,student:memberId},function(err){
    if(err){
     Framework7App.dialog.alert(err.toString())
     throw new Error(err)
    }
        console.log("done")
      })
    })
  }