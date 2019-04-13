//Get data from indexedDB about specific homework
async function getExistingInfo(homeworkDataElement){
  if(typeof homeworkDataElement==="undefined"){
    homeworkDataElement = lastTouched;
  }
  const id = $(homeworkDataElement).attr("sqlid");
  const result = await worker.postMessage({
    type:"getSingle",
    id
  });
  if((!result)||result.length==0){
    //Perhaps indexedDB screwed up 
    return JSON.parse(localStorage.getItem("data")).filter((homework)=>{
      return homework.id == id;
    })[0];
  }
  return result;
}

async function updateChannelHomework(channel,channelData){
  let existingData = await worker.postMessage({
    type:"get",
  });
  if(!existingData || existingData.length==0){
    existingData = JSON.parse(localStorage.getItem("data"));
  }
  const otherChannelHomework = [];
  for(const homework of existingData){
    if(homework.channel!=channel){
      otherChannelHomework.push(homework);
    }
  }
  console.log(otherChannelHomework,channelData,channel);
  const newData = [...otherChannelHomework,...channelData];
  //Put data into client-side database for caching
  worker.postMessage({
    type:"set",
    data:newData
  });
  //Add to localstorage as a fallback
  localStorage.setItem("data",JSON.stringify(newData));
  return newData;
}

//Show info about homework
async function loadDetails(element){
  const data = await getExistingInfo(element);
  const {subject,isTest,text,dueDate,lastEditTime:editTime,lastEditPerson:editPerson} = data;
  $("#detailLastEdit").text(Sugar.Date.format(new Date(editTime),"{d}/{M}/{yyyy}")+" "+Sugar.Date.format(new Date(editTime),"%I:%M")+Sugar.Date.format(new Date(editTime),"%P")+" by "+editPerson);
  $("#detailHomeworkName").text(text);
  $("#detailSubject").text(subject);
  if(isTest){
    $("#detailGraded").text("Yes");
  }else{
    $("#detailGraded").text("No");
  }
  $("#detailDue").text(new Date(dueDate).getFullYear()===2099 ? "Unknown" : `${Sugar.Date.format(new Date(dueDate),"%d/%m/%Y %H:%M")}, ${dateParser.daysUntil(new Date(dueDate))} days left.`);
  detailsSheet.open();
}

//Details bottom sheet
let detailsSheet;
Framework7App.loadModules(["sheet"]).then(()=>{
  detailsSheet = Framework7App.sheet.create({
    el:".sheet-modal",
    backdrop:true
  });
  detailsSheet.on("open",()=>{
    $(".view.view-main").append($(".sheet-backdrop.backdrop-in"));
  });
});
let ptr = Framework7App.ptr.get('.page-current .ptr-content');
ptr.on("refresh",async (_,done)=>{
  $("#hwboard-homework-list").html("<div class=homework-reload-status>Reloading homework...</div>");
  setTimeout(async ()=>{
    await loadHomework(true);
    done();
  },300);
});
function rerenderSort(){
  if(document.getElementById("sort-set-default").checked){
    document.cookie = "sortType="+sortOptions.type;
    document.cookie = "sortOrder="+sortOptions.order;
  }
  worker.postMessage({
    type:"get"
  }).then(data=>{
    if((!data)||data.length==0){
      //Perhaps indexedDB screwed up 
      data = JSON.parse(localStorage.getItem("data"));
    }
    reRender(data).then(()=>{
      $(".swipeout-actions-left").css("visibility","visible");
      $(".swipeout-actions-right").css("visibility","visible");
    });
  });
}