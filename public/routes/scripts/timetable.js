async function renderTimetable(){
  function pickTextColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (Math.round(((r * 0.299) + (g * 0.587) + (b * 0.114))) >= 180) ?
      darkColor : lightColor;
  }
  const colors = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC']
  if(!Object.keys(timetable).length){
    await loadHomework()
  }
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
  const events = []
  for(const subject in modifiedTimetable){
    const lessons = modifiedTimetable[subject]
    for (const dayName in lessons){
      const day = lessons[dayName][0]
      const eventStart = Sugar.Date.create(`${dayName} ${Math.floor(day[0]/100)}:${(day[0] % 100).toString().padStart(2,"0")}`)
      const eventEnd = Sugar.Date.create(`${dayName} ${Math.floor(day[1]/100)}:${(day[1] % 100).toString().padStart(2,"0")}`)
      const color = colors[Object.keys(modifiedTimetable).indexOf(subject)] || "#3B3EAC"
      events.push({
        title:subject,
        start:eventStart,
        end:eventEnd,
        allDay:false,
        color,
        textColor:pickTextColor(color,"white","black")+";font-size:1.2em;"
      })
    }
  }
  $('#hwboard-timetable').fullCalendar({
    header: {
        left: '',
        center: '',
        right: ''
    },
    events,
    columnFormat: 'ddd',
    defaultView: 'agendaWeek',
    hiddenDays: [0,6],
    weekNumbers:  false,
    minTime: '08:00:00',
    maxTime: '18:00:00',
    slotDuration: '00:30:00',
    slotLabelInterval:{minutes:30},
    slotLabelFormat:'h:mma',
    allDaySlot: false,
    nowIndicator:true
  })
}

