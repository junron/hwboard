const columnWidth = 50
let table = document.querySelector("#app .page-current table")
const timingToPeriod = timing => {
  const period = (timing - 800)/50
  return Math.round(period)
}
const renderDay = day =>{
  let html = `<tr><td style="width:${columnWidth}px">${day.day}</td>`
  //Number of half hour intervals
  let lastLessonTime = 800
  const lessonEndTime = 1800
  for(const lesson of day.lessons){
    const {subject,timing} = lesson
    const startTime = timingToPeriod(timing[0])
    const interval = timingToPeriod(timing[1]-timing[0]+800)
    if(lastLessonTime<timing[0]){
      const breakInterval = timingToPeriod(timing[0]-lastLessonTime+800)
      html +=`<td style="width:${breakInterval*50}px" colspan=${breakInterval}></td>`
    }
    lastLessonTime = timing[1]
    //const subjectColor = intToRGB(hashCode(subject))
    html +=`<td style="width:${interval*50}px;" colspan=${interval}>${subject}</td>`
  }
  if(lastLessonTime<lessonEndTime){
    const breakInterval = timingToPeriod(lessonEndTime-lastLessonTime+800)
    html +=`<td style="width:${breakInterval*50}px" colspan=${breakInterval}></td>`
  }
  html += "</tr>"
  return html
}
const sortByTime = timetable =>{
  const resultData = []
  const days = ["mon","tue","wed","thu","fri"]
  for(const day of days){
    const lessons = timetable[day]
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