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
  $("#hwboard-homework-list").html(renderer(data,sortType,sortOrder))
}