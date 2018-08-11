async function renderTimetable(){
  if(!Object.keys(timetable).length){
    await loadChannelData()
  }
  table = document.querySelector("#app .page-current table")
  const sortedTimetable = sortByTime(arrangeByDay(timetable))
  table.innerHTML += getTimeHeadings()
  for(const day of sortedTimetable){
    const [concurrentSubjects,formattedDay] = getMetaData(insertBreak(day))
    table.innerHTML += renderDay([concurrentSubjects,formattedDay])
  }
}
renderTimetable()