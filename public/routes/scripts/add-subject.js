const addSubjectTimings = {}
$(document).on("click","#app .page-current table#homeworkboard-timetable td",e=>{
  if(e.target.innerHTML===" "){
    const output = $("#app .page-current .add-subject-timetable-output")
    const target = $(e.target)
    const day = target.attr("data-day")
    const time = target.attr("data-time-start")
    if(target.css("background-color")==="rgb(216, 255, 224)"){
      output.append(`<span id=${day}-${time}>${day}, ${time}<br></span>`)
      target.css("background-color","#99cdf3")
    }else{
      $(`#${day}-${time}`).remove()
      target.css("background-color","#d8ffe0")
    }
  }
})
document.getElementById("add-subject").addEventListener("click",()=>{
  const data = getSubjectData()
  data.channel = channel
  console.log(data)
  conn.emit("addSubject",data,(err)=>{
    if(err) throw new Error(err)
    mainView.router.back()
  })
})