$(function() {
  // page is now ready, initialize the calendar...
    const calendarPadding = 100;
    const calendarHeight = window.innerHeight - calendarPadding;

  setTimeout($('#calendar').fullCalendar({
    // put your options and callbacks here
      height: calendarHeight
  }),10);

});
