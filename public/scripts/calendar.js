colors = ["#3366CC","#DC3912","#FF9900","#109618","#990099","#3B3EAC","#0099C6","#DD4477","#66AA00","#B82E2E","#316395","#994499","#22AA99","#AAAA11","#6633CC","#E67300","#8B0707","#329262","#5574A6","#3B3EAC"];

function pickTextColor(bgColor, lightColor, darkColor) {
  var color = (bgColor.charAt(0) === "#") ? bgColor.substring(1, 7) : bgColor;
  var r = parseInt(color.substring(0, 2), 16); // hexToR
  var g = parseInt(color.substring(2, 4), 16); // hexToG
  var b = parseInt(color.substring(4, 6), 16); // hexToB
  return (Math.round(((r * 0.299) + (g * 0.587) + (b * 0.114))) >= 180) ?
    darkColor : lightColor;
}

function convertHomework(arrHomework) {
  let calendarEvents = [];
  for (const eachHomework of arrHomework) {
    const eventColor = subjectColors[0][subjectColors[1].findIndex(function (findSubject) {return findSubject === eachHomework.subject;})] || "#3B3EAC";
    const event ={
      title: eachHomework.text,
      id: eachHomework.subject,
      start: eachHomework.dueDate.slice(0, 10),
      allDay: true,
      color: eventColor,
      textColor:pickTextColor(eventColor,"#ffffff","#000000")
    };
    calendarEvents.push(event);
  }
  return calendarEvents;
}


function updateHomework() {
  hwboard.getHomework(false).then(async ({promises})=>{
    const p1 = await promises[0];
    const p2 = await promises[1];
    let hw;
    if(p1 && (p1.length>p2.length || !p2)){
      hw = p1;
    }else{
      if(p2){
        hw = p2;
      }else{
        hw = [];
      }
    }
    const homeworkEvents = convertHomework(hw);
    $("#calendar").fullCalendar("removeEventSources");
    const eventsToRender = {
      events: homeworkEvents,
      textColor: "white"
    };
    $("#calendar").fullCalendar("addEventSource", eventsToRender);
    console.log("Homework Events rendered on calendar");
  });
}

function setColors() {
  subjectColors = [[],[]];
  hwboard.getChannelData().then(({quickest:data})=>{
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
  const {name:currView} = $("#calendar").fullCalendar( "getView" );
  if(currView==="basicWeek"){
    $("#calendar").fullCalendar("changeView", "month");
  }else{
    $("#calendar").fullCalendar("changeView", "basicWeek");
  }
}

calendarWeekends = false;
function calendarInit(){
  const calendarPadding = 180;
  const calendarHeight = window.innerHeight - calendarPadding;

  $("#calendar").fullCalendar({
    header: {
      left: "title",
      center: "",
      right: "",
    },
    weekends:false,
    defaultView:"basicWeek",
    height: calendarHeight,
    editable: false,
    firstDay:1,
    views:{
      month: {
        columnHeaderFormat:"ddd"
      },
      basicWeek:{
        columnHeaderFormat:"ddd D/M"
      },
    },
    eventAfterRender: eventObj =>{
      const start = new Date($("#calendar").fullCalendar("getView").start);
      const end = new Date($("#calendar").fullCalendar("getView").end);
      for(const homework of eventObj.source.rawEventDefs){
        const date = new Date(homework.start);
        if(date>end || date<start){
          continue;
        }
        const dow = Sugar.Date.format(date,"{dow}");
        if((dow[0] === "s")){
          if(!calendarWeekends){
            calendarWeekends = true;
            $("#calendar").fullCalendar("option", {weekends:true});
            return;
          }
          return;
        }
      }
      if(calendarWeekends){
        calendarWeekends = false;
        $("#calendar").fullCalendar("option", {weekends:false});
      }
    },
    viewRender: view=>{
      if(view.type==="basicWeek"){
        dateParser.getTermXWeekY(new Date(view.end - 24 * 60 * 60 * 1000)).then(({term,week})=>{
          let weekText = ` (Term ${term} Week ${week})`;
          if(term==="Holiday"){
            weekText = " (Holiday)";
          }
          let title = $("#calendar .fc-toolbar .fc-left h2").text().split("undefined").join("").replace(/\((.*?)\)/,weekText);
          if(!title.includes(weekText)){
            title+=weekText;
          }
          $("#calendar .fc-toolbar .fc-left h2").text(title);
        });
      }
    },
    eventClick: (eventObj,e)=> {
      const formattedDate = new Date(eventObj.start).toDateString();
      Framework7App.loadModules(["popover"]).then(()=>{
        const popover = Framework7App.popover.create({
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
      });
    }

  });
  const todayDow = Sugar.Date.format(new Date(),"{dow}");
  if(todayDow[0] === "s" && $("#calendar").fullCalendar( "getView" ).name==="basicWeek"){
    $("#calendar").fullCalendar("next");
  }
  setColors();
}

