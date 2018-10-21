async function renderTimetable(){
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
  const colors = tinygradient(['#00e5bc', '#8ed200', '#c42700']).hsv(Object.keys(modifiedTimetable).length)
  for(let subject in modifiedTimetable){
    const lessons = modifiedTimetable[subject]
    const color = colors[Object.keys(modifiedTimetable).indexOf(subject)].toHexString()
    for (const dayName in lessons){
      const day = lessons[dayName][0]
      const eventStart = Sugar.Date.create(`${dayName} ${Math.floor(day[0]/100)}:${(day[0] % 100).toString().padStart(2,"0")}`)
      const eventEnd = Sugar.Date.create(`${dayName} ${Math.floor(day[1]/100)}:${(day[1] % 100).toString().padStart(2,"0")}`)
      //Ensure that subjects do not get cutoff in a weird way
      if(window.innerWidth<450){
        const cutoff = 4
        if(subject.length>cutoff){
          const subjectParts = subject.split(" ")
          subject = subjectParts[0].slice(0,cutoff)
          if(subject[subject.length-1]==="l"){
            subject = subject.slice(0,3)
          }
        }
      }
      let textColor = tinycolor.mostReadable(color,["#fff","#000"]).toHexString()
      textColor = (textColor==="#000000" && tinycolor.readability(textColor,color)<5) ? "#fff" : textColor
      events.push({
        title:subject,
        start:eventStart,
        end:eventEnd,
        allDay:false,
        color,
        textColor:textColor+";font-size:1.2em;"
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
    slotEventOverlap:false,
    nowIndicator:true
  })
}

