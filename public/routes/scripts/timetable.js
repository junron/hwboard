function renderTimetable(){
  table = document.querySelector("#app .page-current table")
  const sortedTimetable = sortByTime(arrangeByDay(timetable))
  table.innerHTML += getTimeHeadings()
  for(const day of sortedTimetable){
    table.innerHTML += renderDay(day)
  }
}
renderTimetable()