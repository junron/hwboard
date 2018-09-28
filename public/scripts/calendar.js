colors = ["#FEA47F", "#25CCF7", "#EAB543", "#55E6C1", "#CAD3C8", "#F97F51", "#1B9CFC", "#F8EFBA", "#58B19F", "#2C3A47", "#B33771", "#3B3B98", "#FD7272", "#9AECDB", "#D6A2E8", "#6D214F", "#182C61", "#FC427B", "#BDC581", "#82589F"];

function picktextColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (Math.round(((r * 0.299) + (g * 0.587) + (b * 0.114))) >= 180) ?
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
    hwboard.getHomework(false).then(async ({promises})=>{
        const p1 = await promises[0]
        const p2 = await promises[1]
        let hw
        if(p1.length>p2.length){
            hw = p1
        }else{
            hw = p2
        }
        const homeworkEvents = convertHomework(hw);
        $('#calendar').fullCalendar('removeEventSources');
        const eventsToRender = {
            events: homeworkEvents,
            textColor: 'white'
        };
        $('#calendar').fullCalendar('addEventSource', eventsToRender);
        console.log("Homework Events rendered on calendar");
    })
}

function setColors() {
    subjectColors = [[],[]];
    hwboard.getChannelData().then(({quickest:data})=>{
        console.log(data)
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
    })
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
let calendarWeekends = false;
function calendarInit(){
    const calendarPadding = 100;
    const calendarHeight = window.innerHeight - calendarPadding;

    $('#calendar').fullCalendar({
        header: {
            left: 'title',
            center: '',
            right: '',
        },
        weekends:false,
        defaultView:"basicWeek",
        height: calendarHeight,
        editable: false,
        eventAfterRender: eventObj =>{
            const start = new Date($('#calendar').fullCalendar('getView').start)
            const end = new Date($('#calendar').fullCalendar('getView').end)
            for(const homework of eventObj.source.rawEventDefs){
                const date = new Date(homework.start)
                if(date>end || date<start){
                    continue
                }
                const dow = Sugar.Date.format(date,"{dow}")
                if((dow === "sun" || dow === "sat")){
                    if(!calendarWeekends){
                        calendarWeekends = true
                        $('#calendar').fullCalendar('option', {weekends:true})
                        return
                    }
                    return
                }
            }
            if(calendarWeekends){
                calendarWeekends = false
                $('#calendar').fullCalendar('option', {weekends:false})
            }
        },
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
