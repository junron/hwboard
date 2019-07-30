function renderTimetable(selector, editable = false) {
  const editingSubject = editable && location.hash.includes("/popups/edit-subject/");
  const editingSubjectName = editingSubject ? location.hash.split("/popups/edit-subject/")[1] : undefined;

  if (editingSubject) {
    $(".page-current .title").text("Edit subject");
    addFloating("#subjectInput");
    $("#subjectInput").val(editingSubjectName);
    $("#subjectInput").addClass("disabled");
  }

  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const parseTime = time =>
    Math.floor(time / 100).toString().padStart(2, '0') +
    ":" +
    (time % 100).toString().padStart(2, '0');

  const config = {
    header: {
      left: '',
      center: '',
      right: '',
    },
    plugins: ['dayGrid', 'timeGrid', 'interaction'],
    weekends: false,
    defaultView: "timeGridWeek",
    editable: false,
    firstDay: 1,
    views: {
      timeGridWeek: {
        columnHeaderFormat: { weekday: 'short' }
      },
    },
    nowIndicator: true,
    allDaySlot: false,
    selectMirror: true,
    selectOverlap: false,
    selectable: editable,
    select: info => timingChangeCallback(calendar, info),
    selectLongPressDelay: 10,
    minTime: "08:00",
    maxTime: "18:00",
    height: "auto",
    slotLabelInterval: { minutes: 30 },
    selectConstraint: {
      startTime: "08:00",
      endTime: "18:00",
    },
    selectAllow: info => {
      // Limit to 4 hours
      return (info.end - info.start) <= 14400000;
    },
    eventRender: info => {
      if (info.event._def.groupId === "addSubject") {
        if ($(info.el).children(".fc-content").children(".fc-title").length) {
          $(info.el).children(".fc-content").children(".fc-title").text($(".page-current #subjectInput").val());
          return;
        }
        $(info.el).children(".fc-content").append(`<div class='fc-title'>${$(".page-current #subjectInput").val()}</div>`);
      }
      if (!info.isMirror) return;
      $(info.el).children(".fc-content").append(`<div class='fc-title'>${$(".page-current #subjectInput").val()}</div>`);
    }

  };
  const calculateSmallestDay = times => {
    let n = 0;
    for (const day of daysOfWeek) {
      if (times[day]) {
        return n + times[day][0][0];
      }
      n++;
    }
  };
  const allColors = ["#ff0000", "#ff2000", "#ff4000", "#ff5f00", "#ff7f00", "#ff9900", "#ffb200", "#ffcc00", "#ffe500", "#ffff00", "#ccff00", "#99ff00", "#66ff00", "#33ff00", "#00ff00", "#00ff66", "#00ffcc", "#00ccff", "#0066ff", "#0000ff", "#1b00e6", "#2f00cd", "#3e00b4", "#48009b", "#4b0082", "#580092", "#6600a2", "#7400b3", "#8400c3", "#9400d3"];

  const assemblyAndCCA = {
    "Assembly": {
      "mon": [[1500, 1600]]
    },
    "CCA": {
      "mon": [[1600, 1800]],
      "fri": [[1600, 1800]]
    }
  };

  const modifiedTimetable = Object.assign(assemblyAndCCA, timetable);
  const subjects = Object.entries(modifiedTimetable).sort(([_, a], [_b, b]) => {
    return calculateSmallestDay(a) - calculateSmallestDay(b);
  });

  let n = -1;
  config.events = subjects
    .map(([subject, times]) => {
      const isEditingSubject = editingSubject ? subject === editingSubjectName : location.hash.includes("/popups/edit-subject/");
      n++;
      const color = allColors[Math.floor(30 / subjects.length) * n] + (location.hash.includes("/timetable/") || isEditingSubject ? "bf" : "40");
      const textColor = !location.hash.includes("/timetable/") && !isEditingSubject ? "white"
        : tinycolor.readability(color, "#fff") < 3 ? "black" : "white";
      return Object.entries(times)
        .map(([day, [time]]) => {
          console.log(isEditingSubject);
          return {
            groupId: isEditingSubject ? "addSubject" : undefined,
            title: subject,
            daysOfWeek: [daysOfWeek.indexOf(day)],
            startTime: parseTime(time[0]),
            endTime: parseTime(time[1]),
            editable: false,
            color,
            textColor
          };
        });
    }).flat();

  const calendar = new FullCalendar.Calendar($(selector)[0], config);
  addSubjectCalendar = calendar;
  calendar.render();
}