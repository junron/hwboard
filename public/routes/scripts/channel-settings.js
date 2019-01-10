function getChannelData(){
  //Load data from indexedDB, in case there is no internet
  worker.postMessage({
    type:"getSingleChannelByName",
    name:channel
  }).then((data)=>{
    if(!data.name){
      //IndexedDB is empty, perhaps is first page load
      return;
    }
    console.log("Load channels from IndexedDB");
    return renderChannelData(data);
  });
  //Load data from websocket
  conn.emit("channelDataReq",{channel},async function(err,data){
    if(err){
      Framework7App.dialog.alert(err.toString());
      throw new Error(err);
    }
    console.log("Load channels from websocket");
    return renderChannelData(data);
  });
}

async function renderChannelData(data){
  $(".root-only").hide();
  const {render} = renderAdmins;
  document.getElementById("member-list").innerHTML = await render(data);
  document.getElementById("subject-list").innerHTML = renderSubjects(data);
  document.getElementById("tag-list").innerHTML = renderTags(data);
  conn.emit("whoami",null,async function(err,name){
    if(err){
      Framework7App.dialog.alert(err.toString());
      throw new Error(err);
    }
    if(data.roots.includes(name)){
      $(".root-only").show();
      $("a[href='/channels/channelName/settings/popups/add-member/'").attr("href",`/channels/${channel}/settings/popups/add-member/`);
      $("a[href='/channels/channelName/settings/popups/add-subject/'").attr("href",`/channels/${channel}/settings/popups/add-subject/`);
      $("a[href='/channels/channelName/settings/popups/add-tag/'").attr("href",`/channels/${channel}/settings/popups/add-tag/`);
    }
  });
}
//Db inited, can get data
conn.on("ready",()=>{
  if(location.hash.includes("/channels/")&&location.hash.includes("/settings")&&!location.hash.includes("/popups/")){
    console.log("ready");
    getChannelData();
  }
});


conn.on("channelData",async function(data){
  if(location.hash.includes("/channels/")&&location.hash.includes("/settings")&&!location.hash.includes("/popups/")){
    const {render} = renderAdmins;
    const thisChannelData = data[channel];
    document.getElementById("member-list").innerHTML = await render(thisChannelData);
    document.getElementById("subject-list").innerHTML = renderSubjects(thisChannelData);
  }
});
function deleteMember(memberElem){
  const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1];
  const memberId = memberEmail.replace("@nushigh.edu.sg","");
  Framework7App.dialog.confirm("Are you sure you want to remove "+memberEmail +"?",function(){
    conn.emit("removeMember",{channel,students:[memberId]},function(err){
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw new Error(err);
      }
      console.log("done");
    });
  });
}
function promoteMember(memberElem){
  const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1];
  const memberId = memberEmail.replace("@nushigh.edu.sg","");
  Framework7App.dialog.confirm("Are you sure you want to promote " + memberEmail + "?",function(){
    conn.emit("promoteMember",{channel,students:[memberId]},function(err){
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw new Error(err);
      }
      console.log("done");
    });
  });
}
function demoteMember(memberElem){
  const memberEmail = memberElem.children[0].children[0].children[0].innerText.split("\n")[1];
  const memberId = memberEmail.replace("@nushigh.edu.sg","");
  Framework7App.dialog.confirm("Are you sure you want to demote " + memberEmail + "?",function(){
    conn.emit("demoteMember",{channel,students:[memberId]},function(err){
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw new Error(err);
      }
      console.log("done");
    });
  });
}

function deleteSubject(subjectElem){
  const subjectName = subjectElem.children[0].children[0].children[0].innerText.split("\n")[0];
  Framework7App.dialog.confirm("Are you sure you want to delete " + subjectName + "?",function(){
    conn.emit("removeSubject",{channel,subject:subjectName},function(err){
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw new Error(err);
      }
      console.log("done");
    });
  });
}

function deleteTag(tagElem){
  const tagName = tagElem.children[0].children[0].children[0].innerText.split("\n")[0];
  Framework7App.dialog.confirm("Are you sure you want to delete " + tagName + "?",function(){
    conn.emit("removeTag",{channel,tag:tagName},function(err){
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw new Error(err);
      }
      getChannelData();
      console.log("done");
    });
  });
}