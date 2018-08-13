async function renderTimetable(){
  if(!Object.keys(timetable).length){
    await loadChannelData()
  }
  timetable = {"Jap yey":{"mon":[[1300,1400]],"tue":[[1400,1500]],"thu":[[1630,1730]]},"CS problem solving":{"thu":[[1500,1800]]}}
  table = document.querySelector("#app .page-current table")
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
    table.innerHTML += renderDay([concurrentSubjects,formattedDay])
  }
}
renderTimetable()