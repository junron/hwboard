const calendar = new FullCalendar.Calendar($("#calendar")[0],{
  header: {
    left: '',
    center: '',
    right: '',
  },
  plugins: ['dayGrid','timeGrid','interaction'],
  weekends:false,
  defaultView:"timeGridWeek",
  editable: true,
  firstDay:1,
  views:{
    timeGridWeek:{
      columnHeaderFormat:{ weekday: 'short' }
    },
  },
  allDaySlot:false,
  selectMirror:true,
  selectable:true,
  minTime:"08:00",
  maxTime:"18:00",
  height:"auto",
  slotLabelInterval:{minutes:30},
  selectConstraint:{
    startTime:"08:00",
    endTime:"18:00",
  },
  selectAllow:info=>{
    // Limit to 4 hours
    return (info.end-info.start)<=14400000;
  }
});

calendar.render();