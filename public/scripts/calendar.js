colors = ["#ff5252", "#ff4081", "#e040fb", "#7c4dff", "#536dfe", "#448aff", "#40c4ff", "#18ffff", "#64ffda", "#69f0ae", "#b2ff59", "#eeff41", "#ffff00", "#ffd740", "#ffab40", "#ff6e40"];

function picktextColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (Math.round(((r * 0.299) + (g * 0.587) + (b * 0.114))) >= 186) ?
      darkColor : lightColor;
  }

function convertHomework(arrHomework) {
    let calendarEvents = [];
    for (const eachHomework of arrHomework) {
        const eventColor = subjectColors[0][subjectColors[1].findIndex(function (findSubject) {return findSubject === eachHomework.subject})] || "#3B3EAC"
        const event ={
            title: eachHomework.text,
            id: eachHomework.subject,
            start: eachHomework.dueDate.slice(0, 10),
            allDay: true,
            color: eventColor,
            textColor:picktextColor(eventColor,"#ffffff","#000000")
        };
        calendarEvents.push(event);
    }
    return calendarEvents;
}


function updateHomework() {
    conn.emit("dataReq",{removeExpired:false},(err,data)=>{
        if(err)
            throw err;
        const hw = data;
        const homeworkEvents = convertHomework(hw);
        $('#calendar').fullCalendar('removeEventSources');
        const eventsToRender = {
            events: homeworkEvents,
            textColor: 'white'
        };
        $('#calendar').fullCalendar('addEventSource', eventsToRender);
        console.log("Homework Events rendered on calendar");
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
        let a = 0;
        for (let i = 0; i < colors.length; i++){
            subjectColors[0].push(colors[i]);
            subjectColors[1].push(allSubjects[a]);
            a++;
        }
        console.log("colours set");
        updateHomework();
    });
}

conn.on("ready",setColors);
conn.on("data",setColors);
function changeView(){
    const {name:currView} = $('#calendar').fullCalendar( 'getView' )
    if(currView==="basicWeek"){
        $('#calendar').fullCalendar('changeView', 'month')
        $("#calendar-next").text("Next month")
        $("#calendar-prev").text("Prev month")
    }else{
        $('#calendar').fullCalendar('changeView', 'basicWeek')
        $("#calendar-next").text("Next week")
        $("#calendar-prev").text("Prev week")
    }
}
function calendarInit(){
    const calendarPadding = 100;
    const calendarHeight = window.innerHeight - calendarPadding;

    $('#calendar').fullCalendar({
        header: {
            left: 'title',
            center: '',
            right: '',
        },
        defaultView:"basicWeek",
        height: calendarHeight,
        editable: false,
        viewRender: (view,elem)=>{
            if(view.type==="basicWeek"){
                dateParser.getTermXWeekY(new Date(view.end)).then(({term,week})=>{
                    let weekText = ` (Term ${term} Week ${week})`
                    if(term==="Holiday"){
                        weekText = " (Holiday)"
                    }
                    $("#calendar .fc-toolbar .fc-left h2").text($("#calendar .fc-toolbar .fc-left h2").text()+weekText)
                })
            }
        },
        eventClick: (eventObj,e)=> {
            const formattedDate = new Date(eventObj.start).toDateString()
            let popover = Framework7App.popover.create({
                targetEl: e.target,
                content: `<div class="popover">
                <div class="popover-inner">
                <div class="block">
                <h1>${eventObj.title}</h1>
                <p>${eventObj.id}<br/>Due ${formattedDate}</p>
                </div>
                </div>
                </div>`
            });
            popover.open();
        }

    });

    setColors();
}
