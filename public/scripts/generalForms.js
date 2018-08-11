//Get data from indexeddb about specific homework
async function getExistingInfo(){
  const id = parseInt($(lastTouched).attr("sqlid"))
  const result = await worker.postMessage({
    type:"getSingle",
    id
  })
  if((!result)||result.length==0){
    //Perhaps indexeddb screwed up 
    return JSON.parse(localStorage.getItem("data")).filter((homework)=>{
      return homework.id == id
    })[0]
  }
  return result
}

async function updateChannelHomework(channel,channelData){
  let existingData = await worker.postMessage({
    type:"get",
  })
  if(!existingData || existingData.length==0){
    existingData = JSON.parse(localStorage.getItem("data"))
  }
  const otherChannelHomework = []
  for(const homework of existingData){
    if(homework.channel!=channel){
      otherChannelHomework.push(homework)
    }
  }
  console.log(otherChannelHomework,channelData,channel)
  const newData = [...otherChannelHomework,...channelData]
  //Put data into client-side database for caching
  worker.postMessage({
    type:"set",
    data:newData
  })
  //Add to localstorage as a fallback
  localStorage.setItem("data",JSON.stringify(newData))
  return newData
}

//Show info about homework
async function loadDetails(){
  const data = await getExistingInfo()
  const {subject,isTest,text,dueDate,lastEditTime:editTime,lastEditPerson:editPerson} = data
  $("#detailLastEdit").text(Sugar.Date.format(new Date(editTime),"{d}/{M}")+" "+Sugar.Date.format(new Date(editTime),"%I:%M")+Sugar.Date.format(new Date(editTime),"%P")+" by "+editPerson)
    $("#detailHomeworkName").text(text)
    $("#detailSubject").text(subject)
    if(isTest){
      $("#detailGraded").text("Yes")
    }else{
      $("#detailGraded").text("No")
    }
    $("#detailDue").text(`${Sugar.Date.format(new Date(dueDate),"%d/%m/%Y %H:%M")}, ${daysUntil(new Date(dueDate))} days left.`)
    detailsSheet.open()
  }

//Get cookies
//Re-render homework
function reRender(data){
  const sortType = sortOptions.type || getCookie("sortType") || "Due date"
  let sortOrder = sortOptions.order || 0
  console.log("called",subjectChannelMapping)
  // let n =0
  // while(!Object.keys(subjectChannelMapping).length && n<10000){
  //   //Wait for channelData to be loaded
  //   if(!n){
  //     console.log("Waiting for subject channel map to load")
  //   }
  //   n++
  // }
  // console.log(n)
  $("#hwboard-homework-list").html(renderer(data,sortType,sortOrder))
}

//Details bottom sheet
const detailsSheet = Framework7App.sheet.create({
  el:".sheet-modal",
  backdrop:true
})
function rerenderSort(){
  if(document.getElementById("sort-set-default").checked){
    document.cookie = "sortType="+sortOptions.type
    document.cookie = "sortOrder="+sortOptions.order
  }
  worker.postMessage({
    type:"get"
  }).then(data=>{
    if((!data)||data.length==0){
      //Perhaps indexeddb screwed up 
      data = JSON.parse(localStorage.getItem("data"))
    }
    reRender(data)
  })
}