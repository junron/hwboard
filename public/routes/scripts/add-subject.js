let addSubjectCalendar;
function timingChangeCallback(calendar,event) {
  addSubjectCalendar = calendar;
  calendar.unselect();
  calendar.addEvent({
    groupId:"addSubject",
    start:event.start,
    end:event.end,
    title:$("#subjectInput").val()
  });
  updateDisabledStatus();
}

function resetTimings(){
  addSubjectCalendar.unselect();
  const events = addSubjectCalendar.getEvents().filter(e=>e._def.groupId==="addSubject");
  events.map(e=>e.remove());
  updateDisabledStatus();
}

function updateDisabledStatus() {
  if(!addSubjectCalendar) return false;
  addSubjectCalendar.rerenderEvents();
  checkIfComplete()
    ? $(".page-current #add-subject").removeClass("disabled")
    : $(".page-current #add-subject").addClass("disabled");
}

function checkIfComplete() {
  if(!addSubjectCalendar) return false;
  const events = addSubjectCalendar.getEvents().filter(e=>e._def.groupId==="addSubject");
  return $("#subjectInput").val().trim().length !== 0 && events.length !== 0;
}

function addSubject(){
  const daysOfWeek = ["sun","mon","tue","wed","thu","fri","sat"];
  const events = addSubjectCalendar.getEvents().filter(e=>e._def.groupId==="addSubject").map(a=>a._instance.range);
  const subjectName = $("#subjectInput").val().trim();
  const parsed = events.reduce((acc,cur)=>{
    const start = cur.start;
    start.setHours(start.getHours()-8);
    const end = cur.end;
    end.setHours(end.getHours()-8);
    const day = daysOfWeek[start.getDay()];
    const startTime = start.getHours()*100+start.getMinutes();
    const endTime = end.getHours()*100+end.getMinutes();
    if(acc[day]){
      acc[day].push([startTime,endTime]);
    }else{
      acc[day] = [[startTime,endTime]];
    }
    return acc;
  },{});
  const subjectData = {
    subject:subjectName,
    channel,
    data:parsed
  };
  conn.emit("addSubject",subjectData,err=>{
    if(err){
      Framework7App.dialog.alert(err.toString());
      throw err;
    }
    mainView.router.back();
  });
}

//Event listeners
$(document).on("input", ".page-current #subjectInput", updateDisabledStatus);
$(document).on("click", ".page-current #add-subject", addSubject);
$(document).on("click", ".page-current #reset-timings", resetTimings);