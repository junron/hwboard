function renderTimetable(){
  table = document.querySelector("#app .page-current table")
  const demoTimeTable = {"Physics":{"mon":[[800,930]],"wed":[[800,930]]},"English":{"mon":[[1100,0]],"wed":[[1200,1300]],"thu":[[1400,1500]]},"Math":{"mon":[[1000,1100]],"tue":[[1300,1400]],"wed":[[930,1030]],"thu":[[1100,1200]]},"Humanities":{"tue":[[800,900]]},"PE":{"tue":[[900,1000]],"thu":[[800,900]]},"Chemistry":{"tue":[[1130,1300]],"fri":[[1030,1200]]},"Biology":{"thu":[[930,1100]],"fri":[[830,1000]]},"Geography":{"fri":[[1300,1500]]},"CCE":{"wed":[[1300,1400]]}}
  const sortedTimetable = sortByTime(arrangeByDay(demoTimeTable))
  table.innerHTML += getTimeHeadings()
  for(const day of sortedTimetable){
    table.innerHTML += renderDay(day)
  }
}
renderTimetable()