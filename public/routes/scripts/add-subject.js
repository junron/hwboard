let addSubjectTimings = {};
const addSubjectTiming = start => {
  start = new Date(start);
  const day = ["sun","mon","tue","wed","thu","fri","sat"][start.getDay()];
  const startTime = start.getHours() * 100 + start.getMinutes();
  const endTime = (startTime + 30) % 100==60 ? startTime + 70 : startTime + 30;
  addSubjectTimings[day] = addSubjectTimings[day] === undefined 
    ? [[startTime,endTime]]
    : [...addSubjectTimings[day],[startTime,endTime]];
  addSubjectTimings[day] = addSubjectTimings[day].sort(([a],[b])=>{
    return a>b ? 1 
      : b>a ? -1 
        : 0;
  });
  updateDisabledStatus();
};
const removeSubjectTiming = start => {
  start = new Date(start);
  const day = ["sun","mon","tue","wed","thu","fri","sat"][start.getDay()];
  const startTime = start.getHours() * 100 + start.getMinutes();
  const index =  addSubjectTimings[day].findIndex(([start,_])=>start===startTime);
  addSubjectTimings[day].splice(index,1);
  addSubjectTimings[day] = addSubjectTimings[day].sort(([a],[b])=>{
    return a>b ? 1 
      : b>a ? -1 
        : 0;
  });
  if(addSubjectTimings[day].length===0) delete addSubjectTimings[day];
  updateDisabledStatus();
};

const parseTimeIntervalArray = array =>{
  const output = [array[0]];
  for(let i =1;i<array.length;i++){
    //Start is same as previous end
    if(array[i][0]==output[output.length-1][1]){
      //Extend previous time interval to end of current one
      output[output.length-1][1] = array[i][1];
    }else{
      //New time interval
      output.push(array[i]);
    }
  }
  return output;
};

const addSubject = _ =>{
  const subject = $("#subjectInput").val().trim();
  const times = {};
  for(const day in addSubjectTimings){
    times[day] = parseTimeIntervalArray(JSON.parse(JSON.stringify(addSubjectTimings[day])));
  }
  const subjectData = {
    subject,
    channel,
    data:times
  };
  addSubjectTimings = {};
  if(editingSubject){
    conn.emit("editSubject",subjectData,err=>{
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw err;
      }
      mainView.router.back();
    });
    editingSubject = false;
  }else{
    conn.emit("addSubject",subjectData,err=>{
      if(err){
        Framework7App.dialog.alert(err.toString());
        throw err;
      }
      mainView.router.back();
    });
  }
};

const updateDisabledStatus = _ =>{
  checkIfComplete() 
    ? $(".page-current #add-subject").removeClass("disabled") 
    : $(".page-current #add-subject").addClass("disabled");
};

const checkIfComplete = _ => $("#subjectInput").val().trim().length === 0 
  ? false 
  : Object.keys(addSubjectTimings).length !== 0
    ? true : false;

//Event listeners
$(document).on("input",".page-current #subjectInput",updateDisabledStatus);
$(document).on("click",".page-current #add-subject",addSubject);