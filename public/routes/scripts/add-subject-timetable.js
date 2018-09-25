async function addSubjectRenderTimetable(){
  if(!Object.keys(timetable).length){
    await loadChannelData()
  }
  table = document.querySelector("#app .page-current table#homeworkboard-timetable")
  const assemblyAndCCA = {
    "Assembly":{
      "mon":[[1500,1600]]
    },
    "CCA":{
      "mon":[[1600,1800]],
      "fri":[[1600,1800]]
    }
  }
  const modifiedTimetable = Object.assign(assemblyAndCCA,timetable)
  const sortedTimetable = sortByTime(arrangeByDay(modifiedTimetable))
  table.innerHTML += getTimeHeadings()
  for(const day of sortedTimetable){
    const [concurrentSubjects,formattedDay] = getMetaData(insertBreak(day))
    table.innerHTML += renderDay(concurrentSubjects,formattedDay,false,true)
  }
}

