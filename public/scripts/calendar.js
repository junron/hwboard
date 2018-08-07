function getHomework() {
    conn.emit("dataReq",{},(err,data)=>{
        if(err)
            throw err;
        const hw = data;
    });
    return hw;
}

function convertHomework(arrHomework) {
    let calendarEvents = [];
    for (const eachHomework of arrHomework) {
        const event ={
            title: eachHomework.text,
            id: eachHomework.subject,
            start: eachHomework.dueDate,
            allDay: true,
        };
        calendarEvents.appendChild(event);
    }
    return calendarEvents;
}

setTimeout(function() {
    const calendarPadding = 100;
    const calendarHeight = window.innerHeight - calendarPadding;
    const homeworkEvents = convertHomework(getHomework());

    $('#calendar').fullCalendar({
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
        events: homeworkEvents,
    });

}, 100);
