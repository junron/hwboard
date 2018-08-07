$(function() {
  // page is now ready, initialize the calendar...
    const screenPadding = 50;
    let sizeRatio = (window.innerHeight - screenPadding) / (window.innerWidth - screenPadding);

  $('#calendar').fullCalendar({
      editable: false, // Don't allow editing of events
      height: window.innerHeight - screenPadding,
      aspectRatio: sizeRatio,
  })

});
