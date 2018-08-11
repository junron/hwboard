function renderTimetable(){
  table = document.querySelector("#app .page-current table")
  const demoTimeTable = {"Higher Chinese":{"tue":[[1030,1130]],"wed":[[1100,1200]],"thu":[[1200,1300]]},"Chemistry Olympiad":{"thu":[[1500,1800]]},"Biology Olympiad":{"thu":[[1500,1800]]},"Biology":{"mon":[[800,930]],"fri":[[1400,1530]]},"Physics":{"wed":[[800,930]],"fri":[[1030,1200]]},"Chemistry":{"fri":[[830,1000]],"thu":[[1030,1200]]},"English":{"tue":[[1330,1430]],"wed":[[930,1030]],"thu":[[1400,1500]]},"Humanities":{"mon":[[1000,1100]]},"Math":{"mon":[[1100,1200]],"tue":[[800,900]],"wed":[[1200,1300]],"thu":[[930,1030]]},"English Literature":{"tue":[[1130,1330]]},"History":{"tue":[[1130,1330]]}}
  const sortedTimetable = sortByTime(arrangeByDay(demoTimeTable))
  table.innerHTML += getTimeHeadings()
  for(const day of sortedTimetable){
    table.innerHTML += renderDay(getMetaData(insertBreak(day)))
  }
}
renderTimetable()