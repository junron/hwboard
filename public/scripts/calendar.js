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
    });

}, 100);
