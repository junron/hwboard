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
//Show toolbar
function showEditToolbar(){
  $(".mdc-toolbar").css("background-color","#018786")
  $("#editMenu").css("display","initial")
  $("#normalToolbar").css("display","none")
}


//Show info about homework
async function loadDetails(){
  const data = await getExistingInfo()
  const {subject,isTest,text,dueDate,lastEditTime:editTime,lastEditPerson:editPerson} = data
  $("#detailLastEdit").text(Sugar.Date.format(new Date(editTime),"{d}/{M}")+" "+Sugar.Date.format(new Date(editTime),"%I:%M")+Sugar.Date.format(new Date(editTime),"%P")+" by "+editPerson)
    $("#details-sheet-label").text(text)
    $("#detailSubject").text(subject)
    if(isTest){
      $("#detailGraded").text("Yes")
    }else{
      $("#detailGraded").text("No")
    }

    const dateDay = Sugar.Date.create(Sugar.Date.format(new Date(dueDate),"{d}/{M}"),"en-GB")
    $("#detailDue").text(`${Sugar.Date.format(new Date(dueDate),"{d}/{M}")}, ${Sugar.Date.format(new Date(dueDate),"{Dow}")}, ${Sugar.Date.daysUntil(Sugar.Date.create("Today"),dateDay)} days left.`)
    detailsSheet.show()
  }

//Get cookies
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
//Re-render homework
function reRender(data){
  const sortType = sortOptions.type || getCookie("sortType")
  const sortOrder = sortOptions.order || parseInt(getCookie("sortOrder"))
  $(".mdc-list--two-line").html(renderer(data,sortType,sortOrder))
  applyHwEventHandlers()
}