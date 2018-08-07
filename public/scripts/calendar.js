function convertHomework(arrHomework) {
    let calendarEvents = [];
    for (const eachHomework of arrHomework) {
        const event ={
            title: eachHomework.text,
            //id: eachHomework.subject,
            start: eachHomework.dueDate,
            allDay: true,
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
        $('#calendar').fullCalendar('updateEvents', homeworkEvents );
        console.log("Homework Events updated on calendar");
        console.log(homeworkEvents);
    });
}

conn.on("connect",function(){
    updateHomework();
});

setTimeout(function() {
    const calendarPadding = 100;
    const calendarHeight = window.innerHeight - calendarPadding;

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
        events: [],
    });

    updateHomework();

}, 100);
