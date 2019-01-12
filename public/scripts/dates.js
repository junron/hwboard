const dateParserFn = (timetable,subjectSelectionList)=>{
  if(timetable){
    subjectSelectionList = subjectSelectionList || Object.keys(timetable);
  }
  let subject = "";
  if(typeof Sugar === "undefined"){
    Sugar = require("sugar-date");
  }
  /**
   * Finds number of calendar days until a given date.
   * @param {Date} date Date to find days until
   */
  const daysUntil = date =>{
    const roundedDate = roundDate(date);
    return Sugar.Date.daysUntil(Sugar.Date.create("Today"),roundedDate);
  };
  /**
   * Rounds a date to 00:00 that day
   * @param {Date} date 
   */
  const roundDate = date => Sugar.Date.create(Sugar.Date.format(new Date(date),"{d}/{M}/{yyyy}"),"en-GB");

  /**
   * Parses a date string
   * @async
   * @param {String} dateString 
   */
  async function parseDate(dateString){
    dateString = dateString || $(".page-current #dueDate").val();
    if(dateString.toLowerCase().includes("unknown")){
      return NaN;
    }
    if(dateString.toLowerCase().includes("next lesson")){
      const numNextLesson = dateString.toLowerCase().split("next").join("").length-6;
      let nextLesson = new Date();
      for(let i=0;i<numNextLesson;i++){
        nextLesson = await getNextLesson(nextLesson);
      }
      return nextLesson;
    }
    let validatedDate;
    const termDate = await parseTermXWeekY(dateString);
    if(termDate==null){
      validatedDate = await validate(dateString);
    }else{
      validatedDate = termDate;
    }
    if(validatedDate.getHours()==0){
      //Date was specified with "tomorrow" or "next wednesday"
      //If is a school day 
      //and there is lesson for a subject on that day, use lesson time
      const dueDateDay = Sugar.Date.format(validatedDate,"{dow}");
      const subject = await getSubject();
      let lessonTime = await lessonOnDay(subject,dueDateDay);
      if(!lessonTime){
        lessonTime = await endSchoolTime(dueDateDay);
      }
      if(lessonTime===-Infinity){
        //Due date is on a weekend, use 23:59
        validatedDate.setHours(23);
        validatedDate.setMinutes(59);
      }else{
        validatedDate.setHours(Math.floor(lessonTime/100));
        validatedDate.setMinutes(lessonTime%100);
      }
    }
    if(Number.isNaN(daysUntil(validatedDate))){
      throw new Error("Date is too far in the future or too precise");
    }
    return validatedDate;
  }
  /**
   * Parses a string in the form Term X Week Y 
   * into the date object of the first lesson of a subject 
   * @async
   * @param {String} dateString 
   * @returns {Date}
   */
  async function parseTermXWeekY(dateString){
    const parsed = /(Term|T) ?([1-4]) ?(Week|W)? ?(10|[1-9])?$/gi.exec(dateString);
    if(parsed===null){
      return null;
    }
    const terms = [new Date(2019,0,7),new Date(2019,2,25),new Date(2019,6,1), new Date(2019,8,16)];
    const term = parseInt(parsed[2]);
    let week = parseInt(parsed[4]);
    if(term>4 || term<1){
      throw new Error(`Term ${term} is invalid`);
    }
    if(parsed[4]===undefined){
      week = 1;
    }
    if(week>10 || week<1){
      throw new Error(`Week ${week} is invalid`);
    }
    const termStart = terms[term-1];
    let thisStart = Sugar.Date.addWeeks(termStart,week-1);
    if(Sugar.Date.daysUntil(thisStart)>6){
      throw new Error("Date cannot be in the past");
    }
    const subject = await getSubject();
    if(subject!=""){
      if(!subjectSelectionList.includes(subject)){
        throw new Error("Subject is not valid");
      }
      thisStart = await getNextLesson(thisStart);
    }
    if(Sugar.Date.isPast(thisStart)){
      throw new Error("Date cannot be in the past");
    }
    return thisStart;
  }
  /**
   * Returns the term and week number, given a date
   * @param {Date} date 
   */
  async function getTermXWeekY(date){
    const terms = [new Date(2019,0,7),new Date(2019,2,25),new Date(2019,6,1), new Date(2019,8,16)];
    const term = terms.filter(term => date>term).length;
    const termStart = terms[term-1];
    if(termStart===undefined){
      return {
        term:"Holiday",
        week:""
      };
    }
    const week = Math.floor(Sugar.Date.daysUntil(termStart,date)/7)+1;
    if(week>10){
      return {
        term:"Holiday",
        week:""
      };
    }
    return {
      term,
      week
    };
  }
  /**
   * Ensures that the date given is not in the past.
   * Rounds the date if it is found to be in the past
   * @param {String} dateString 
   * @async
   */
  async function validate(dateString){
    let date = Sugar.Date.create(dateString,"en-GB");
    const days = daysUntil(date);
    //Date is 1 week ago, throw error
    if(days < -6){
      throw new Error("Date cannot be in the past");
    }
    if(days < 0){
      //If today is friday, typing tuesday would produce a date in the past
      // Add 1 week to make it next tuesday
      date = Sugar.Date.addWeeks(date,1);
    }
    return date;
  }
  const splitTime = time =>{
    let hr = Math.floor(time / 100);
    let min = time % 100;
    if(hr<10){
      hr = "0" + hr.toString();
    }
    if(min<10){
      min = "0" + min.toString();
    }
    return [hr,min];
  };

  /**
   * Takes an object of {day:[[start,end],[start,end]]} and flattens it into a 1d array of dates
   * @param {Object} daysObject 
   * @param {Date} mustBeAfter Minimum time for date
   * @async
   */
  async function rankDays(daysObject,mustBeAfter=new Date()){
    const rankedTimings = [];
    for (const day in daysObject){
      for(const timing of daysObject[day]){
        //Take the end time, homework can still be submitted at the end of lesson?
        const startTime = splitTime(timing[1]).join(":");
        let date = Sugar.Date.create(`${day} ${startTime}`);
        //If lesson is not in future,add 1 week
        date = await validate(date);
        date = await minDateAfter(date,mustBeAfter);
        rankedTimings.push(date);
      }
    }
    return rankedTimings;
  }
  /**
   * Gets the next lesson
   * @async
   * @param {Date} minDate
   */
  async function getNextLesson(minDate=new Date()){
    const subject = await getSubject();
    const subjectTimeData = timetable[subject];
    const times = await rankDays(subjectTimeData,minDate);
    return new Date(Math.min(...times));
  }
  const getTimingsForDay = async targetDay=>{
    const timings = [];
    for(const subject in timetable){
      for (const day in timetable[subject]){
        if(day!=targetDay){
          continue;
        }else{
          for(const timing of timetable[subject][day]){
            //We want the end time
            timings.push(timing[1]);
          }
        }
      }
    }
    return timings;
  };
  /**
   * Gets the end time of the last lesson
   * @async
   * @param {String} day A lowercase day of the week (mon,tue,wed,thu,fri,sat,sun)
   */
  async function endSchoolTime(day){
    const timings = await getTimingsForDay(day);
    return Math.max(...timings);
  }
  /**
   * Gets that end time of a lesson on a day
   * @async
   * @param {String} lesson Subject name
   * @param {String} day A lowercase day of the week (mon,tue,wed,thu,fri,sat,sun)
   */
  async function lessonOnDay(lesson,day){
    if(timetable[lesson] && timetable[lesson][day]){
      return Math.max(...([].concat(...timetable[lesson][day])));
    }
  }
  /**
   * Returns the date that is on the same day of the week and
   * at the same time of the day as `date`, but after `minDate`
   * @param {Date} date 
   * @param {Date} minDate 
   */

  //TODO: This uses an O(n) algorithm but an O(1) is probably possible
  async function minDateAfter(date,minDate){
    while (date.getTime()<=minDate.getTime()){
      date = Sugar.Date.addWeeks(date,1);
    }
    return date;
  }

  async function getSubject(){
    let currSubject;
    if(typeof $ !== "undefined"){
      currSubject = $("#subject-name").val();
    }else{
      currSubject = subject;
    }
    if(!subjectSelectionList.includes(currSubject)){
      throw new Error("Subject is not valid");
    }
    return currSubject;
  }
  async function setSubject(target){
    subject = target;
  }
  return {
    parseDate,
    daysUntil,
    setSubject,
    getTermXWeekY
  };
};

if(typeof module !== 'undefined'){
  module.exports = dateParserFn;
}else{
  dateParser = Object.freeze(dateParserFn(timetable,subjectSelectionList));
}