function convertHomework(arrHomework) {
    let calendarEvents = [];
    for (const eachHomework of arrHomework) {
        const event ={
            title: eachHomework.text,
            id: eachHomework.subject,
            start: eachHomework.dueDate.slice(0, 10),
            allDay: true
        };
        calendarEvents.push(event);
    }
    return calendarEvents;
}

function callback(thing) {
    return thing;
}

function updateHomework() {
    conn.emit("dataReq",{},(err,data)=>{
        if(err)
            throw err;
        const hw = data;
        const homeworkEvents = convertHomework(hw);
        $('#calendar').fullCalendar('removeEventSource', $('#calendar').fullCalendar('getEventSources'));
        const eventsToRender = {
            events: homeworkEvents,
            textColor: 'white'
        };
        $('#calendar').fullCalendar('addEventSource', eventsToRender);
        console.log("Homework Events rendered on calendar");
        console.log(homeworkEvents);
    });
}

conn.on("connect",function(){
    updateHomework();
});

function init(){
  if(!$('#calendar').length || ! $('#calendar').fullCalendar){
    return setTimeout(init, 10);
  }
  const calendarPadding = 100;
  const calendarHeight = window.innerHeight - calendarPadding;

  $('#calendar').fullCalendar({
    defaultView: 'month',
    eventLimit: true,
    header: {
      left: 'title',
      center: '',
      right: 'prev,next today',
    },
    buttonIcons: {
      prev: 'left-single-arrow',
      next: 'right-single-arrow',
    },
    height: calendarHeight,
    editable: false,
    events: [],
    eventRender: function(eventObj, $el) {
      $el.popover({
        title: eventObj.title,
        content: eventObj.description,
        trigger: 'hover',
        placement: 'top',
        container: 'body'
      });
    }
  });

  updateHomework();
}
setTimeout(init, 10);
