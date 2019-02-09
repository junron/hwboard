//Turns channel data into variables
function setSubjectVariables(channelData){
  if(typeof channelData != "object" || channelData === null || channelData.null){
    return false;
  }
  timetable = {};
  subjectChannelMapping = {};
  subjectSelectionList = [];
  subjectTagMapping = {};
  for(const channelName in channelData){
    const channel = channelData[channelName];
    timetable = Object.assign(timetable,channel.timetable);
    for (const subject of channel.subjects){
      //User is admin or higher of channel
      if(channel.permissions>=2){
        subjectSelectionList.push(subject);
        subjectChannelMapping[subject] = channel.name;
      }
      subjectTagMapping[subject] = channel.tags;
    }
  }
  dateParser = Object.freeze(dateParserFn(timetable,subjectSelectionList));
}

channelSettings = {
  channel,
  removeExpired:true
};

prevDataHash = "";
//Get cookies
//Re-render homework
async function reRender(data){
  if(data.null){
    return;
  }
  async function computeHash(data){
    const hashBytes = await crypto.subtle.digest("SHA-512",new TextEncoder("utf-8").encode(data));
    const hash = btoa(new Uint8Array(hashBytes).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    return hash;
  }
  const sortType = sortOptions.type || getCookie("sortType") || "Due date";
  let sortOrder = sortOptions.order || 0;
  const hashHomeworkData = data.sort((a,b)=>{
    aHash = a.id+a.text+a.subject+a.dueDate+a.lastEditPerson+a.lastEditTime+a.tags;
    bHash = b.id+b.text+b.subject+b.dueDate+b.lastEditPerson+b.lastEditTime+b.tags;
    if(aHash > bHash){
      return -1;
    }else if(aHash < bHash){
      return 1;
    }else{
      return 0;
    }
  });
  const hashData = JSON.stringify(hashHomeworkData)+sortOrder+sortType;
  const hash = await computeHash(hashData);
  if(hash!==prevDataHash){
    const rendered = renderer(data,sortType,sortOrder);
    $("#hwboard-homework-list").html(rendered);
    console.log("rerendered");
    prevDataHash = hash;
  }
}

async function loadHomework(){
  async function getBestPromise(obj){
    const results = await Promise.all(obj.promises);
    if(results[0] && (results[0].length===1||results[1]===undefined)){
      return results[0];
    }
    if(results[0] && results[0].length && (!results[1].length || results[0].length>results[1].length)){
      return results[0];
    }
    if(!results[1]){
      const res = [];
      res["null"] = true;
      return res;
    }
    return results[1];
  }
  const results = await Promise.all([
    hwboard.getHomework(),
    hwboard.getChannelData()
  ]);
  const [homeworkData,channelData] = await Promise.all(results.map(getBestPromise));
  setSubjectVariables(channelData);
  await reRender(homeworkData);
  $(".swipeout-actions-left").css("visibility","visible");
  $(".swipeout-actions-right").css("visibility","visible");
}
loadHomework();