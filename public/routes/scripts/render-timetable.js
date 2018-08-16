const columnWidth = Math.floor(innerWidth/20)
const timeNow = new Date();//new Date("8/9/2018 10:30")
let table = document.querySelector("#app .page-current table")
const timingToPeriod = timing => {
  const period = (timing - 800)/50
  return Math.round(period)
}

const insertBreak = day =>{
  const {lessons} = day
  let lastLessonTime = 800
  for(let i=0;i<lessons.length;i++){
    const lesson = lessons[i]
    if(lesson.timing[0]>lastLessonTime){
      //Free period!!!!
      const freePeriod = {
        subject:" ",//"Free Period",
        timing:[
          lastLessonTime,
          lesson.timing[0]
        ]
      }
      lessons.splice(i,0,freePeriod)
      i += 1
    }
    lastLessonTime = lesson.timing[1]
  }
  return day
}

const getMetaData = day =>{
  let lessonsNow = []
  let maxConcurrentLessons = 0
  for(const lesson of day.lessons){
    const [lessonStart,lessonEnd] = lesson.timing
    lessonsNow = lessonsNow.filter(a=>{
      const [thisLessonStart,thisLessonEnd] = a.timing
      return (thisLessonStart<=lessonStart) && (thisLessonEnd >= lessonEnd)
    })
    lessonsNow.push(lesson)
    lesson.position = lessonsNow.indexOf(lesson)
    for(const lessonNow of lessonsNow){
      lessonNow.concurrentLessons = lessonsNow.length
    }
    if(lessonsNow.length>maxConcurrentLessons){
      maxConcurrentLessons = lessonsNow.length
    }
  }
  return [maxConcurrentLessons,day]
}

const getDayClass = day =>{
  if(day.day == Sugar.Date.format(timeNow,"{dow}")){
    return [parseInt(Sugar.Date.format(timeNow,'%H%M')),"<tr class='timetable-today'>"]
  }else if(day.day == Sugar.Date.format(Sugar.Date.addDays(new Date(timeNow),1),"{dow}")){
    return [null,"<tr class='timetable-tomorrow'>"]
  }else{
    return [null,"<tr>"]
  }
}
const renderDay = ([concurrentLessons,day]) =>{
  let html = ""
  const [now,dayHTML] = getDayClass(day)
  const rows = Array(concurrentLessons).fill(dayHTML)
  rows[0] += `<td rowspan=${concurrentLessons} style="width:${columnWidth}px">
    ${day.day}
  </td>`
  //Number of half hour intervals
  let lastLessonTime = 800
  const lessonEndTime = 1800
  //For coloring
  let lessonNowEndTime = false
  for(const lesson of day.lessons){
    let cssClass = ""
    const {subject,timing} = lesson
    const startTime = timingToPeriod(timing[0])
    const interval = timingToPeriod(timing[1]-timing[0]+800)

    if(now){
      if(now<timing[1]&&now>=timing[0]){
        lessonNowEndTime = timing[1]
        cssClass = "timetable-now"
      }else if(lessonNowEndTime==timing[0]){
        cssClass = "timetable-next"
      }
    }

    if(lesson.concurrentLessons==1){
      rows[0] += `<td class='${cssClass}' style="width:${interval*columnWidth}px;height:50px" rowspan=${concurrentLessons/lesson.concurrentLessons} colspan=${interval}>${subject}</td>`
    }else{
      rows[lesson.position] += `<td class='${cssClass}' style="width:${interval*columnWidth}px;" rowspan=${concurrentLessons/lesson.concurrentLessons} colspan=${interval}>${subject}</td>`
    }
    lastLessonTime = timing[1]
  }
  html += rows.join("</tr>")
  //Lesson at the end of the day
  if(lastLessonTime<lessonEndTime){
    const breakInterval = timingToPeriod(lessonEndTime-lastLessonTime+800)
    html +=`<td style="width:${breakInterval*columnWidth}px" colspan=${breakInterval}></td>`
  }
  return html
}
const sortByTime = timetable =>{
  const resultData = []
  const days = ["mon","tue","wed","thu","fri"]
  for(const day of days){
    const lessons = timetable[day]
    if(!lessons){
      continue
    }
    const sortedLessons = lessons.sort((a,b)=>{
      if(a.timing[0]>b.timing[0]){
        return 1
      }else if(a.timing[0]<b.timing[0]){
        return -1
      }else{
        return 0
      }
    })
    resultData.push({
      day,
      lessons:sortedLessons
    })
  }
  return resultData
}
const arrangeByDay = timetable =>{
  const resultData = {}
  for(const subject in timetable){
    const subjectData = timetable[subject]
    for (const day in subjectData){
      const timing = subjectData[day][0]
      if(!resultData[day]){
        resultData[day] = [{
          subject,
          timing
        }]
      }else{
        resultData[day].push({
          subject,
          timing
        })
      }
    }
  }
  return resultData
}
function getTimeHeadings(){
  const times = []
  let html = `<tr><td style="width:${columnWidth}px" colspan="1"></td>`
  let num = 1
  for(let i = 800;i<=1800;){
    times.push(i)
    if(num<0){
      i+=70
    }else{
      i += 30
    }
    num = num * -1
  }
  for(let i = 0;i<20;i++){
    html += `<td style="width:${columnWidth}px" colspan="1">${times[i]}<br>${times[i+1]}</td>`
  }
  return html + "<\/tr>"
}
