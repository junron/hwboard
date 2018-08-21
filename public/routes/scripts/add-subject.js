const addSubjectTimings = {}
const parsedAddSubjectTimings = {}
const numericalOrder = (a,b)=>a-b;
$(document).on("click","#app .page-current table#homeworkboard-timetable td",e=>{
  if(e.target.innerHTML===" "){
    const output = $("#app .page-current .add-subject-timetable-output")
    const target = $(e.target)
    const day = target.attr("data-day")
    const time = parseInt(target.attr("data-time-start"))
    if(target.css("background-color")==="rgb(216, 255, 224)"){
      target.css("background-color","#99cdf3")
      if(addSubjectTimings[day] instanceof Array){
        addSubjectTimings[day].push(time)
        addSubjectTimings[day] = addSubjectTimings[day].sort(numericalOrder)
      }else{
        addSubjectTimings[day] = [time]
      }
    }else{
      target.css("background-color","#d8ffe0")
      const index = addSubjectTimings[day].indexOf(time)
      if(index>-1){
        addSubjectTimings[day].splice(index,1)
      }
    }
    const increasingSubSequences = [[]]
    //Note: addSubjectTimings[day] is sorted
    for(const timing of addSubjectTimings[day]){
      const thisIncrease = increasingSubSequences[increasingSubSequences.length-1]
      if(thisIncrease.length==0){
        thisIncrease.push(timing)
      }else if(timing-thisIncrease[thisIncrease.length-1]===30 || timing-thisIncrease[thisIncrease.length-1]==70){
        thisIncrease.push(timing)
      }else{
        increasingSubSequences.push([timing])
      }
    }
    parsedAddSubjectTimings[day] = []
    $(`span[data-day=${day}]`).remove()
    for(const timingArray of increasingSubSequences){
      if(timingArray.length===0){
        delete parsedAddSubjectTimings[day]
        break
      }
      let endTime = Math.max(...timingArray) + 30
      if(endTime%100==60){
        endTime += 40
      }
      const startTime = Math.min(...timingArray)
      const timings = [startTime,endTime]
      if(document.querySelector(`span[data-day=${day}]`)){
        output.append(`<span data-day=${day}>, and from ${startTime} to ${endTime}</span>`)
      }else{
        output.append(`<span data-day=${day}><br>${day} from ${startTime} to ${endTime}</span>`)
      }
      parsedAddSubjectTimings[day].push(timings)
    }
  }
})
document.getElementById("add-subject").addEventListener("click",()=>{
  const subject = $("#subjectInput").val()
  const subjectData = {
    subject,
    channel,
    data:parsedAddSubjectTimings
  }
  conn.emit("addSubject",subjectData,(err)=>{
    if(err) throw new Error(err)
    mainView.router.back()
  })
})