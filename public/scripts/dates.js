const daysUntil = date =>{
  const roundedDate = roundDate(date);
  return Sugar.Date.daysUntil(Sugar.Date.create("Today"),roundedDate)
};
const roundDate = date => Sugar.Date.create(Sugar.Date.format(new Date(date),"{d}/{M}/{yy}"),"en-GB")

async function parseDate(dateString){
  dateString = dateString ||$(".page-current #dueDate").val();
  if(dateString.toLowerCase()=="next lesson"){
    return getNextLesson()
  }
  const validatedDate = await validate(dateString);
  if(validatedDate.getHours()===0){
    //Date was specified with "tomorrow" or "next wednesday"
    //If is a school day 
    //and there is lesson for a subject on that day, use lesson time
    const dueDateDay = Sugar.Date.format(validatedDate,"{dow}");
    const subject = $(".page-current #subject-name").val();
    let lessonTime = await lessonOnDay(subject,dueDateDay);
    if(!lessonTime){
      lessonTime = await endSchoolTime(dueDateDay);
    }
    if(lessonTime===-Infinity){
      //Due date is on a weekend, use 23:59
      validatedDate.setHours(23);
      validatedDate.setMinutes(59);
    }else{
      validatedDate.setHours(Math.floor(lessonTime/100));
      validatedDate.setMinutes(lessonTime%100);
    }
  }
  return validatedDate
}

//Ensures that date is not in the past
async function validate(dateString){
  // 
  let date = Sugar.Date.create(dateString,"en-GB");
  const days = daysUntil(date);
  //Date is 1 week ago, throw error
  if(days < (-6)){
    throw new Error("Date cannot be in the past");
  }
  if(days < 0){
    //If today is friday, typing tuesday would produce a date in the past
    // Add 1 week to make it next tuesday
    date = Sugar.Date.addWeeks(date,1);
  }
  return date
}
const splitTime = time =>{
  let hr = Math.floor(time / 100);
  let min = time % 100;
  if(hr<10){
    hr = "0" + hr.toString();
  }
  if(min<10){
    min = "0" + min.toString();
  }
  return [hr,min];
}

//Takes an object of {day:[[start,end],[start,end]]} and flattenss it into a 1d array of dates
async function rankDays(daysObject){
  const rankedTimings = [];
  for (const day in daysObject) {
    if (daysObject.hasOwnProperty(day)) {
        for (const timing of daysObject[day]) {
            if (daysObject[day].hasOwnProperty(timing)) {
                //Take the end time, homework can still be submitted at the end of lesson?
                const startTime = splitTime(timing[1]).join(":");
                let date = Sugar.Date.create(`${day} ${startTime}`);
                //If lesson is not in future,add 1 week
                date = await validate(date);
                if (Sugar.Date.isPast(date)) {
                    date = Sugar.Date.addWeeks(date, 1)
                }
                rankedTimings.push(date)
            }
        }
    }
  }
  return rankedTimings
}
async function getNextLesson(){
  const subject = $("#subject-name").val();
  if(!subjectSelectionList.includes(subject)){
    throw new Error("Subject is not valid")
  }
  const subjectTimeData = timetable[subject];
  const times = await rankDays(subjectTimeData);
  return new Date(Math.min(...times))
}
const getTimingsForDay = async targetDay=>{
  const timings = [];
  for(const subject in timetable){
    for (const day in timetable[subject]){
      if(day!==targetDay){
        continue;
      }else{
        for(const timing of timetable[subject][day]){
          //We want the end time
          timings.push(timing[1])
        }
      }
    }
  }
  return timings
};
async function endSchoolTime(day){
  const timings = await getTimingsForDay(day);
  return Math.max(...timings)
}

async function lessonOnDay(lesson,day){
  if(timetable[lesson] && timetable[lesson][day]){
    return Math.max(...([].concat(...timetable[lesson][day])))
  }
}