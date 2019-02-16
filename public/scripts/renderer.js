const renderer = (()=>{
  if(typeof Sugar == "undefined" || typeof tinycolor == "undefined"){
    if(typeof navigator=="undefined"){
      Sugar = require("sugar-date");
      tinycolor = require("tinycolor2");
    }
  }
  const filterDue = a => new Date(a.dueDate) >= (new Date() - 3600000);

  const gradedFirst = (a,b) => {
    if(a.isTest > b.isTest){
      return -1;
    }else if(a.isTest < b.isTest){
      return 1;
    }
    if(a.tags.includes("Optional") > b.tags.includes("Optional")){
      return 1;
    }else if(a.tags.includes("Optional") < b.tags.includes("Optional")){
      return -1;
    }
    return 0;
  };

  const dueEarlierFirst = (a,b) => {
    const daysLeftA = Sugar.Date.daysUntil(Sugar.Date.create("Today"), Sugar.Date.create(Sugar.Date.format(new Date(a.dueDate), "{d}/{M}/{yyyy}"), "en-GB"));
    const daysLeftB = Sugar.Date.daysUntil(Sugar.Date.create("Today"), Sugar.Date.create(Sugar.Date.format(new Date(b.dueDate), "{d}/{M}/{yyyy}"), "en-GB"));
    if(daysLeftA > daysLeftB){
      return 1;
    }else if(daysLeftA < daysLeftB){
      return -1;
    }
    return 0;
  };

  const subjectFirst = (a,b) => {
    if((a.subject+a.text).toLowerCase() > (b.subject+b.text).toLowerCase()){
      return 1;
    }else if((a.subject+a.text).toLowerCase() < (b.subject+b.text).toLowerCase()){
      return -1;
    }
    return 0;
  };
  const parseBySubject = (data,order=0) => {
    data = data.filter(filterDue);
    data = data.sort(function(a,b){
      const returnValue = subjectFirst(a,b);
      if(returnValue){
        if(!order){
          return returnValue;
        }else{
          return returnValue * -1;
        }
      }
      const graded = gradedFirst(a,b);
      if(graded){
        return graded;
      }else{
        return dueEarlierFirst(a,b);
      }
    });
    let subjects = [];
    let html = "";
    const subjectEnd = `</ul></div>`;
    for (let homework of data) {
      let subject = homework.subject;
      if (subjects.indexOf(subject) == -1) {
        if(subjects.length!=0){
          html += subjectEnd;
        }
        const subjectId = "hex" + toHex(subject);
        html += `
        <div class="list-group">
          <ul id="${subjectId}">
            <li style="padding-top:5px" class="list-group-title">${subject}</li>
        `;
        subjects.push(subject);
      }
      html+= parseHomeworkSubject(homework);
    }
    if(html==""){
      return "<div style='text-align: center;font-size:2em;margin:0.67em'>No homework yay</div>";
    }
    html+="</div></ul>";
    return html;
  };
  const parseHomeworkSubject = homework =>{
    const {
      id,
      iconColor,
      bgColor,
      icon,
      text,
      displayDate,
      dueDate2,
      extra,
      subject
    } = parseHomeworkMetaData(homework);
    let rendered = `
    <li class="hwitem swipeout" sqlID="${id}" style="color:${iconColor};background-color:${bgColor}">
    <div class="swipeout-content item-content">
      <div class="item-media">
          <i class="material-icons" style="color:${iconColor}" aria-hidden="true">${icon}</i>
      </div>
      <div class="item-inner">
        <div class="item-title">
          ${text}
          <div class="item-footer">
            ${displayDate} (${Sugar.Date.format(dueDate2,"{d}/{M}")})${extra}
          </div>
          </div>
          </div>
        </div>
      <div class="swipeout-actions-left hwboard-item-info">
        <a class="swipeout-close swipeout-overswipe" style="background-color:#2196f3">Info</a>
      </div>`;
    if(subjectChannelMapping[subject]){
      rendered += `<div class="swipeout-actions-right">
            <a class="swipeout-close swipeout-edit-button" style="background-color:#ff9800">Edit</a>
            <a class="swipeout-close hwboard-item-delete" style="background-color:#f44336">Delete</a>
          </div>
        </li>
        `;
    }
    return rendered;
  };
  const parseByDate = (data,order=0) => {
    data = data.filter(filterDue);
    data = data.sort(function(a,b){
      const returnValue = dueEarlierFirst(a,b);
      if(returnValue){
        if(!order){
          return returnValue;
        }else{
          return returnValue * -1;
        }
      }
      const graded = gradedFirst(a,b);
      if(graded){
        return graded;
      }else{
        return subjectFirst(a,b);
      }
    });
    let dates = [];
    let html = "";
    const dateEnd = `</ul></div>`;
    for (let homework of data) {
      let {displayDate,dueDate2,daysLeft} = parseHomeworkMetaData(homework);
      if (dates.indexOf(displayDate) == -1) {
        if(dates.length!=0){
          html += dateEnd;
        }
        html += `
        <div class="list-group">
          <ul id="${daysLeft}">
            <li style="padding-top:5px" class="list-group-title">${displayDate} ${displayDate === "Due date unknown" ? "" : `(${Sugar.Date.format(dueDate2,"{d}/{M}")})`}</li>
        `;
        dates.push(displayDate);
      }
      html+= parseHomeworkDate(homework);
    }
    if(html==""){
      return "<div style='text-align: center;font-size:2em;margin:0.67em'>No homework yay</div>";
    }
    html+="</div></ul>";
    return html;
  };

  const parseHomeworkDate = homework => {
    const {
      subject,
      id,
      iconColor,
      bgColor,
      icon,
      text,
      extra,
      subjectText
    } = parseHomeworkMetaData(homework);
    let rendered = `
    <li class="hwitem swipeout" sqlID="${id}" style="color:${iconColor};background-color:${bgColor}">
    <div class="swipeout-content item-content">
      <div class="item-media">
          <i class="material-icons" style="color:${iconColor}" aria-hidden="true">${icon}</i>
      </div>
      <div class="item-inner">
        <div class="item-title">
          ${text}
          <div class="item-footer">
            ${subjectText}${extra}
          </div>
        </div>
      </div>
    </div>
    <div class="swipeout-actions-left hwboard-item-info">
      <a class="swipeout-close swipeout-overswipe" style="background-color:#2196f3">Info</a>
    </div>`;
    if(subjectChannelMapping[subject]){
      rendered += `<div class="swipeout-actions-right">
          <a class="swipeout-close swipeout-edit-button" style="background-color:#ff9800">Edit</a>
          <a class="swipeout-close hwboard-item-delete" style="background-color:#f44336">Delete</a>
        </div>
      </li>
      `;
    }
    return rendered;
  } ;
  const toHex = str=>{
    var hex, i;

    var result = "";
    for (i=0; i<str.length; i++) {
      hex = str.charCodeAt(i).toString(16);
      result += (hex).slice(-4);
    }

    return result;
  };
  const parseHomeworkMetaData = homework => {
    let {
      id,
      subject,
      dueDate,
      isTest,
      text,
      tags,
      lastEditPerson: editPerson,
      lastEditTime: editTime,
    } = homework;
    const defaultTagMapping = {
      "Graded" : "red",
      "Optional" : "green"
    };
    const tagMapping = subjectTagMapping[subject] || defaultTagMapping;

    tags = tags.filter(tag => tag.length>0);
    let dueDate2 = Sugar.Date.create(dueDate);
    let daysLeft = Sugar.Date.daysUntil(Sugar.Date.create("Today"), Sugar.Date.create(Sugar.Date.format(dueDate2, "{d}/{M}/{yyyy}"), "en-GB"));
    let iconColor = "";
    if (Sugar.Date.isToday(dueDate2)) {
      daysLeft = 0;
      iconColor = "red";
    } else if (Sugar.Date.isTomorrow(dueDate2)) {
      iconColor = "#ab47bc";
    }
    let icon = "";
    let bgColor =  "#bbdefb";
    let extra = "";
    let tagMode = "graded";
    if(typeof location != "undefined"){
      if(location.search.includes("tagMode=original")){
        tagMode = "original";
      }
    }
    let subjectText = subject;
    if(tagMode!=="original"){
      subjectText = `    <div class="chip" style="background-color:#26c6da">
        <div class="chip-label" style="color:white">${subject}</div>
      </div>`;
      for(const tag of tags){
        const tagTextColor = tinycolor.readability(tagMapping[tag],"#fff")<2 ? "black" : "white";
        extra += `    <div class="chip" 
        style="background-color:${tagMapping[tag]};color:${tagTextColor}">
          <div class="chip-label">${tag}</div>
        </div>`;

      }
    }
    if(tagMode=="original"){
      bgColor = "";
    }
    if (isTest) {
      icon = "&#xe900;";
      if(tagMode=="original"){
        bgColor = "#bbdefb";
        extra = ", Graded";
      }
    }
    if (isTest) {
      icon = "&#xe900;";
    } else {
      icon = "&#xe873;";
    }
    let displayDate;
    const getNumberOfSundays = date =>{
      const absDate = Sugar.Date.create(Sugar.Date.format(date, "{d}/{M}/{yyyy}"), "en-GB");
      const startDate = Sugar.Date.create("Today");
      let num = 0;
      while (startDate < absDate){
        if(startDate.getDay()==0){
          num++;
        }
        Sugar.Date.addDays(startDate,1);
      }
      return num;
    };
    switch (daysLeft) {
    case 0:
      displayDate = "Due today";
      break;
    case 1:
      displayDate = "Due tomorrow";
      break;
    default:
      if(dueDate2.getFullYear()===2099){
        displayDate = "Due date unknown";
      }else if(daysLeft<=14 && getNumberOfSundays(dueDate2)==1){
        displayDate = "Next ";
        displayDate+=Sugar.Date.format(dueDate2,"%A");
      }else{
        displayDate = `${daysLeft} days left`;
      }
    }
    return {
      dueDate,
      editTime,
      editPerson,
      isTest,
      subject,
      daysLeft,
      id,
      iconColor,
      bgColor,
      icon,
      text,
      displayDate,
      dueDate2,
      extra,
      subjectText
    };
  };
  return function(data,sortType="Due date",sortOrder=0,subjectChannelMap,subjectTagMap){
    if(subjectChannelMap){
      subjectChannelMapping = subjectChannelMap;
    }
    if(subjectTagMap){
      subjectTagMapping = subjectTagMap;
    }
    if(sortType=="Due date"){
      return parseByDate(data,sortOrder);
    }else{
      return parseBySubject(data,sortOrder);
    }
  };
})();

if(typeof navigator=="undefined"){
  module.exports =  renderer;
}
