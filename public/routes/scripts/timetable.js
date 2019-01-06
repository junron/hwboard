async function renderTimetable(calendarSelector='#hwboard-timetable',showBreaks=false){
  const insertBreaks = timetable=>{
    const days = {};
    //Show free periods after school
    const fakeSubject = {
      "fake subject":{
        mon:[[1900,1930]],
        tue:[[1900,1930]],
        wed:[[1900,1930]],
        thu:[[1900,1930]],
        fri:[[1900,1930]],
      }
    };
    timetable = Object.assign(timetable,fakeSubject);
    for(const subjectName in timetable){
      const subject = timetable[subjectName];
      for(const day in subject){
        if(days[day]===undefined){
          days[day] = subject[day];
        }else{
          days[day] = [...days[day],...subject[day]];
        }
      }
    }
    const breaks = {};
    for(const day in days){
      let prevLessonEnd = 800;
      lessons = days[day].sort((a,b)=>a[0]-b[0]);
      for(const lesson of lessons){
        //There is a space between previous lesson and next lesson
        // console.log({day,prevLessonEnd,lesson})
        if(lesson[0]>prevLessonEnd){
          const halfHours = [];
          for(let i = prevLessonEnd;i<lesson[0];i+=30){
            if(i%100==60){
              i+=40;
            }
            if(i<lesson[0]){
              halfHours.push([i,(i+30)%100==60 ? i+70 : i+30]);
            }
          }
          if(breaks[day]===undefined){
            breaks[day] = halfHours;
          }else{
            breaks[day].push(...halfHours);
          }
        }
        prevLessonEnd = lesson[1];
      }
    }
    return Object.assign(timetable,{" ":breaks});
  };
  if(!Object.keys(timetable).length){
    await loadHomework();
  }
  const assemblyAndCCA = {
    "Assembly":{
      "mon":[[1500,1600]]
    },
    "CCA":{
      "mon":[[1600,1800]],
      "fri":[[1600,1800]]
    }
  };
  const modifiedTimetable = showBreaks ? insertBreaks(Object.assign(assemblyAndCCA,timetable)) : Object.assign(assemblyAndCCA,timetable);
  const events = [];
  const numSubjects = Object.keys(modifiedTimetable).length;
  let range = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#9400D3'];
  if(numSubjects<7){
    const num = Math.floor(numSubjects/2);
    range = range.slice(0,num).concat(range.slice(7-num));
  }
  const colors = tinygradient(range).hsv(numSubjects).map(c=>c.toHexString());
  const getStartTime = subjectName =>{
    const lessons = modifiedTimetable[subjectName];
    return lessons[Object.keys(lessons)[0]][0][0];
  };
  const subjects = Object.keys(modifiedTimetable).sort((subjectA,subjectB)=>{
    const subjectATime = getStartTime(subjectA);
    const subjectBTime = getStartTime(subjectB);
    if(subjectATime>subjectBTime){
      return 1;
    }else if(subjectATime<subjectBTime){
      return -1;
    }
    return 0;
  });
  for(let subject of subjects){
    const lessons = modifiedTimetable[subject];
    const color = subject===" " ? "#009624" : colors[subjects.indexOf(subject)];
    for (const dayName in lessons){
      const dayLessons = lessons[dayName];
      for(const day of dayLessons){
        const eventStart = Sugar.Date.create(`${dayName} ${Math.floor(day[0]/100)}:${(day[0] % 100).toString().padStart(2,"0")}`);
        const eventEnd = Sugar.Date.create(`${dayName} ${Math.floor(day[1]/100)}:${(day[1] % 100).toString().padStart(2,"0")}`);
        //Ensure that subjects do not get cutoff in a weird way
        if(window.innerWidth<450){
          const cutoff = 4;
          if(subject==="Assembly"){
            subject = "Assem";
          }else if(subject.length>cutoff){
            const subjectParts = subject.split(" ");
            subject = subjectParts[0].slice(0,cutoff);
            if(subject[subject.length-1]==="l"){
              subject = subject.slice(0,3);
            }
          }
        }
        let textColor = tinycolor.readability(color,"#fff") < 3 ? "black" : "white"; 
        events.push({
          title:subject,
          start:eventStart,
          end:eventEnd,
          allDay:false,
          color,
          textColor:textColor+`;font-size:1.2em;${showBreaks && color!=="#009624" ? "opacity:0.5;":""}`

        });
      }
    }
  }
  $(calendarSelector).fullCalendar({
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
    nowIndicator:true,
    eventClick: function({title,start}) {
      if(title===" " && showBreaks){
        const selected = $(this).css("background-color") === "rgb(3, 169, 244)";
        if(!selected){
          $(this).css("background-color","#03a9f4");
          $(this).css("border-color","#03a9f4");
          addSubjectTiming(start);
        }else{
          $(this).css("background-color","#009624");
          $(this).css("border-color","#009624");
          removeSubjectTiming(start);
        }
      }
    }
  });
}

