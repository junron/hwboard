function validate(date){
  if(!Sugar.Date.isValid(date)){
    $("#date").addClass("mdc-text-field--invalid")
    $("#dateMsg").addClass("mdc-text-field-helper-text--validation-msg")
    $("#dateMsg").text("Invalid date")
      return
  }
  console.log(date)
  if(Sugar.Date.isBefore(date, Sugar.Date.rewind(new Date(), '1 week', true))){
    $("#date").addClass("mdc-text-field--invalid")
    $("#dateMsg").addClass("mdc-text-field-helper-text--validation-msg")
    $("#dateMsg").text("Date cannot be in past")
      return
  }
  while (Sugar.Date.isBefore(date,Sugar.Date.create("today") )){
    date = Sugar.Date.advance(date,{weeks:1})
    console.log(date)
  }
  return date
}
function lessonTime(day){
  if(subjectSelect.selectedOptions[0]==undefined||subjectSelect.selectedOptions[0].textContent==undefined){
    return
  }
  const motherTongue = ["Chinese","Hindi","Higher Chinese"]
  let subject = subjectSelect.selectedOptions[0].textContent;
  if(motherTongue.indexOf(subject)>-1){
    subject="mother tongue"
  }else if(subject!="CS"){
    subject = subject.toLowerCase()
  }
  let dayOfWeek = Sugar.Date.format(day, '{dow}')
  let subjectData = timetable[subject]
  let times
  if(subjectData&&subjectData.time&&subjectData.time[dayOfWeek]){
    times = subjectData.time[dayOfWeek][0]
  }else{
    return
  }
  if(isNaN(Math.max(...times))){
    return
  }
  let time = Math.max(...times).toString()
  let hr = time.substring(0,time.length-2)
  let min = time.substring(time.length-2,4)
  console.log(day)
  console.log(`${Sugar.Date.format(day, "{d}/{M}")} ${hr}:${min}`)
  return Sugar.Date.create(`${Sugar.Date.format(day, "{d}/{M}")} ${hr}:${min}`,"en-GB")
}
  function parseDate(){
    if($("#dueDate").val().toLowerCase().indexOf("next lesson")>-1){
      if(subjectSelect.selectedOptions[0]==undefined){
        $("#date").addClass("mdc-text-field--invalid")
        $("#dateMsg").addClass("mdc-text-field-helper-text--validation-msg")
        $("#dateMsg").text("No subject selected")
        return
      }
      let date = nextLesson()
      let dateDay = Sugar.Date.create(Sugar.Date.format(new Date(date),"{d}/{M}"),"en-GB")
      $("#outdate").text( "  "+Sugar.Date.medium(new Date(date))+",  In "+Sugar.Date.daysUntil(Sugar.Date.create("Today"),dateDay)+" days time")
      $("#dateMsg").removeClass("mdc-text-field-helper-text--validation-msg ")
      $("#date").removeClass("mdc-text-field--invalid")
      $("#dateMsg").text(`Relative dates such as "next lesson" are accepted`)
      return date
    }
        let date =validate(Sugar.Date.create($("#dueDate").val(),"en-GB"))
try{
  console.log(date)
  if(Sugar.Date.format(Sugar.Date.create($("#dueDate").val(),"en-GB"), '{hh}:{mm}')=="12:00"){
      if(!lessonTime(new Date(date))){
        date = endSchool(Sugar.Date.format(new Date(date), '{dow}'),Sugar.Date.medium(date))
      }else{
        date = lessonTime(new Date(date))
      }
    }
  let dateDay = Sugar.Date.create(Sugar.Date.format(new Date(date),"{d}/{M}"),"en-GB")
  $("#outdate").text( "  "+Sugar.Date.medium(new Date(date))+",  In "+Sugar.Date.daysUntil(Sugar.Date.create("Today"),dateDay)+" days time")
    $("#dateMsg").removeClass("mdc-text-field-helper-text--validation-msg ")
    $("#date").removeClass("mdc-text-field--invalid")
    $("#dateMsg").text(`Relative dates such as "next lesson" are accepted`)
return date
}catch(e){
  console.log(e)
  $("#date").addClass("mdc-text-field--invalid")
  $("#dateMsg").addClass("mdc-text-field-helper-text--validation-msg")
  $("#dateMsg").text("Invalid date")
  return
}
  }
  function nextLesson(){
    const motherTongue = ["Chinese","Hindi","Higher Chinese"]
    let subject = subjectSelect.selectedOptions[0].textContent;
    if(motherTongue.indexOf(subject)>-1){
      subject="mother tongue"
    }else if(subject!="CS"){
      subject = subject.toLowerCase()
    }
    let subjectData = timetable[subject]
  let times = []
  let minDate = Infinity
for (let time in subjectData.time){
  let endTime = subjectData.time[time][0][1].toString()
  let hr = endTime.substring(0,endTime.length-2)
  let min = endTime.substring(endTime.length-2,4)
  let date = Sugar.Date.create(`${time} ${hr}:${min}`,"en-GB")
  if(Sugar.Date.isFuture(date)&&date.getTime()<minDate){
    minDate = date.getTime()
  }
}
if(minDate==Infinity){
  for (let time in subjectData.time){
    let endTime = subjectData.time[time][0][1].toString()
    let hr = endTime.substring(0,endTime.length-2)
    let min = endTime.substring(endTime.length-2,4)
    let date = Sugar.Date.advance(Sugar.Date.create(`${time} ${hr}:${min}`,"en-GB"),"1 week")
    if(Sugar.Date.isFuture(date)&&date.getTime()<minDate){
      minDate = date.getTime()
    }
  }
}
if(minDate==Infinity){
  throw "Wtf"
}
  return minDate
  }
  function endSchool(day,actDay){
    actDay = actDay||""
    let maxTime =0
    for (let subject in timetable){
      for (let time in timetable[subject].time){
        if(time==day){
          for (let tim of timetable[subject].time[time]){
            maxTime = Math.max(maxTime,...tim)
          }
        }
      }
    }
    maxTime = maxTime.toString()
    let hr = maxTime.substring(0,maxTime.length-2)
    let min = maxTime.substring(maxTime.length-2,4)
    day = actDay||day
    console.log(Sugar.Date.create(`${day} ${hr}:${min}`,"en-GB"),day)
    let date = validate(Sugar.Date.create(`${day} ${hr}:${min}`,"en-GB"))
    return date
  }
  const timetable = { "english":{ "teacher":"Mr Selva", "code":"EL2131", "time":{"mon":[[930,1030]],"wed":[["1030","1130"]],"fri":[["1500","1600"]]} }, "math":{ "teacher":"Mrs Wong", "code":"MA2131", "time":{"mon":[[1030,1130]],"tue":[[1230,1330]],"wed":[[1130,1230]],"fri":[[1400,1500]]} }, "chemistry":{ "teacher":"Mrs Chong", "code":"CM2131", "time":{"wed":[[1500,1630]],"fri":[[1000,1130]]} }, "physics":{ "teacher":"Ms Kok", "code":"PC2131", "time":{"thu":[[1300,1430]],"fri":[[1130,1300]]} }, "biology":{ "teacher":"Mr Lee", "code":"BL2131", "time":{"mon":[[1230,1400]],"thu":[[800,930]]} }, "geography":{ "teacher":"Ms Lee", "code":"GE2131", "time":{"tue":[[1030,1230]]} }, "humanities":{ "teacher":"Mrs Yeo", "code":"HU2131", "time":{"fri":[[830,930]]} }, "mother tongue":{ "teacher":"", "code":"", "time":{"mon":[[800,900]],"tue":[[800,900]],"thu":[[1200,1300]]} }, "CS":{ "teacher":"Mr Low", "code":"CS2231", "time":{"thu":[[1500,1800]]} }, "da vinci":{ "teacher":"", "code":"DV2131", "time":{"wed":[[800,1000]]} }, "miscellaneous":{ "teacher":"Mr Selva", "code":"", "time":{"mon":[[1500,1600]],"wed":[[1300,1400]],"fri":[[800,830]]} } }
