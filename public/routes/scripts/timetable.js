function renderTimetable(){
  table = document.querySelector("#app .page-current table")
  // const demoTimeTable = {"Higher Chinese":{"tue":[[1030,1130]],"wed":[[1100,1200]],"thu":[[1200,1300]]},"Chemistry Olympiad":{"thu":[[1500,1800]]},"Biology Olympiad":{"thu":[[1500,1800]]},"Biology":{"mon":[[800,930]],"fri":[[1400,1530]]},"Physics":{"wed":[[800,930]],"fri":[[1030,1200]]},"Chemistry":{"fri":[[830,1000]],"thu":[[1030,1200]]},"English":{"tue":[[1330,1430]],"wed":[[930,1030]],"thu":[[1400,1500]]},"Humanities":{"mon":[[1000,1100]]},"Math":{"mon":[[1100,1200]],"tue":[[800,900]],"wed":[[1200,1300]],"thu":[[930,1030]]},"English Literature":{"tue":[[1130,1330]]},"History":{"tue":[[1130,1330]]},"CS Problem Solving":{"thu":[[1500,1800]]}}
  const sortedTimetable = sortByTime(arrangeByDay(timeTable))
  table.innerHTML += getTimeHeadings()
  // let trHeight = 0
  // let maxTrWidthElem 
  for(const day of sortedTimetable){
    const [concurrentSubjects,formattedDay] = getMetaData(insertBreak(day))
    // trHeight = Math.max(trHeight,concurrentSubjects)
    table.innerHTML += renderDay([concurrentSubjects,formattedDay])
  }
  // const maxHeightTrs = $(`td :not(td[rowspan='${trHeight}'])`).parent()
  // console.log(maxHeightTrs)
  // const heights = maxHeightTrs.map(tr=>tr.offsetHeight)
  // const maxHeight = Math.max(...heights)
  // Array.from(document.querySelectorAll(`td`)).forEach(elem=>{
  //   const diff = maxHeight - elem.offsetHeight 
  //   if(diff){
  //     $(elem).css("padding",diff/2+"px")
  //   }
  // })
}
renderTimetable()