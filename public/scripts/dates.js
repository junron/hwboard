const daysUntil = date =>{
  const roundedDate = roundDate(date)
  return Sugar.Date.daysUntil(Sugar.Date.create("Today"),roundedDate)
}
const roundDate = date => Sugar.Date.create(Sugar.Date.format(new Date(date),"{d}/{M}/{yy}"),"en-GB")

async function parseDate(dateString){
  dateString = dateString ||$("#dueDate").val()
  if(dateString.toLowerCase()=="next lesson"){
    return getNextLesson()
  }
  const validatedDate = await validate(dateString)
  if(validatedDate.getHours()==0){
    //Date was specified with "tomorrow" or "next wednesday"
    //If is a school day, use release time
    const dueDateDay = Sugar.Date.format(validatedDate,"{dow}")
    const releaseTime = await endSchoolTime(dueDateDay)
    if(releaseTime===-Infinity){
      //Due date is on a weekend, use 23:59
      validatedDate.setHours(23)
      validatedDate.setMinutes(59)
    }else{
      validatedDate.setHours(Math.floor(releaseTime/100))
      validatedDate.setMinutes(releaseTime%100)
    }
  }
  return validatedDate
}

//Ensures that date is not in the past
async function validate(dateString){
  // 
  let date = Sugar.Date.create(dateString,"en-GB")
  const days = daysUntil(date)
  //Date is 1 week ago, throw error
  if(days < (-6)){
    throw new Error("Date cannot be in the past")
  }
  if(days < 0){
    //If today is friday, typing tuesday would produce a date in the past
    // Add 1 week to make it next tuesday
    date = Sugar.Date.addWeeks(date,1)
  }
  return date
}
const splitTime = time =>{
  let hr = Math.floor(time / 100)
  let min = time % 100
  if(hr<10){
    hr = "0" + hr.toString()
  }
  if(min<10){
    min = "0" + min.toString()
  }
  return [hr,min]
}

//Takes an object of {day:[[start,end],[start,end]]} and flattenss it into a 1d array of dates
async function rankDays(daysObject){
  const rankedTimings = []
  for (const day in daysObject){
    for(const timing of daysObject[day]){
      //Take the end time, homework can still be submitted at the end of lesson?
      const startTime = splitTime(timing[1]).join(":")
      let date = Sugar.Date.create(`${day} ${startTime}`)
      //If lesson is not in future,add 1 week
      date = await validate(date)
      if(Sugar.Date.isPast(date)){
        date = Sugar.Date.addWeeks(date,1)
      }
      rankedTimings.push(date)
    }
  }
  return rankedTimings
}
async function getNextLesson(){
  const subject = $("#subject-name").val()
  if(!subjectSelectionList.includes(subject)){
    throw new Error("Subject is not valid")
  }
  const subjectTimeData = timetable[subject].time
  const times = await rankDays(subjectTimeData)
  return new Date(Math.min(...times))
}
const getTimingsForDay = async targetDay=>{
  const timings = []
  for(const subject in timetable){
    for (const day in timetable[subject].time){
      if(day!=targetDay){
        continue
      }else{
        for(const timing of timetable[subject].time[day]){
          //We want the end time
          timings.push(timing[1])
        }
      }
    }
  }
  return timings
}
async function endSchoolTime(day){
  const timings = await getTimingsForDay(day)
  return Math.max(...timings)
}
  const timetable = { "english":{ "teacher":"Mr Selva", "code":"EL2131", "time":{"mon":[[930,1030]],"wed":[["1030","1130"]],"fri":[["1500","1600"]]} }, "math":{ "teacher":"Mrs Wong", "code":"MA2131", "time":{"mon":[[1030,1130]],"tue":[[1230,1330]],"wed":[[1130,1230]],"fri":[[1400,1500]]} }, "chemistry":{ "teacher":"Mrs Chong", "code":"CM2131", "time":{"wed":[[1500,1630]],"fri":[[1000,1130]]} }, "physics":{ "teacher":"Ms Kok", "code":"PC2131", "time":{"thu":[[1300,1430]],"fri":[[1130,1300]]} }, "biology":{ "teacher":"Mr Lee", "code":"BL2131", "time":{"mon":[[1230,1400]],"thu":[[800,930]]} }, "geography":{ "teacher":"Ms Lee", "code":"GE2131", "time":{"tue":[[1030,1230]]} }, "humanities":{ "teacher":"Mrs Yeo", "code":"HU2131", "time":{"fri":[[830,930]]} }, "mother tongue":{ "teacher":"", "code":"", "time":{"mon":[[800,900]],"tue":[[800,900]],"thu":[[1200,1300]]} }, "CS":{ "teacher":"Mr Low", "code":"CS2231", "time":{"thu":[[1500,1800]]} }, "da vinci":{ "teacher":"", "code":"DV2131", "time":{"wed":[[800,1000]]} }, "miscellaneous":{ "teacher":"Mr Selva", "code":"", "time":{"mon":[[1500,1600]],"wed":[[1300,1400]],"fri":[[800,830]]} } }
