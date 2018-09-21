colors = ["#ff5252", "#ff4081", "#e040fb", "#7c4dff", "#536dfe", "#448aff", "#40c4ff", "#18ffff", "#64ffda", "#69f0ae", "#b2ff59", "#eeff41", "#ffff00", "#ffd740", "#ffab40", "#ff6e40"];


function convertHomework(arrHomework) {
    let calendarEvents = [];
    for (const eachHomework of arrHomework) {
        const eventColor = subjectColors[0][subjectColors[1].findIndex(function (findSubject) {return findSubject === eachHomework.subject})];
        console.log(eventColor)
        const event ={
            title: eachHomework.text,
            id: eachHomework.subject,
            start: eachHomework.dueDate.slice(0, 10),
            allDay: true,
            color: eventColor
        };
        calendarEvents.push(event);
    }
    return calendarEvents;
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

function setColors() {
    subjectColors = [[],[]];
    conn.emit("channelDataReq",{},(err,data)=>{
        if(err)
            throw err;
        let allSubjects = [];
        for (const channel of data) {
            const channelSubjects = channel.subjects;
            for (const eachSubject of channelSubjects){
                allSubjects.push(eachSubject);
            }
        }
        const spacing = Math.floor(colors.length - allSubjects.length);
        let a = 0;
        for (let i = 0; i < colors.length; i += spacing){
            subjectColors[0].push(colors[i]);
            subjectColors[1].push(allSubjects[a]);
            a++;
        }
        console.log("colours set");
        updateHomework();
    });
}

conn.on("connect",function(){
    setColors();
});
let k
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
        eventClick: (eventObj,e)=> {
            console.log(eventObj,e.target)
            const formattedDate = new Date(eventObj.start).toDateString()
             k = Framework7App.popover.create({
                targetEl: e.target,
                content: `<div class="popover">
                <div class="popover-inner">
                <div class="block">
                <h1>${eventObj.title}</h1>
                <p>${eventObj.id}<br/>${formattedDate}</p>
                </div>
                </div>
                </div>`
            });
            k.open();
        }

    });

    setColors();

}, 1000);
