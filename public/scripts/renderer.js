let parser ={}
if(typeof Sugar =="undefined"){
  if(typeof navigator=="undefined"){
    Sugar = require("sugar-date")
  }
}
parser.parseBySubject = function (data,order=0) {
  data = data.sort(function(a,b){
    if(a.subject>b.subject){
      return -1
    }else if(a.subject<b.subject){
      return 1
    }else{
      return 0
    }
  })
  if(!order){
    data = data.reverse()
  }
  let subjects = []
  let html = ""
  const subjectEnd = `</ul></div>`
  for (let homework of data) {
    let subject = homework.subject
    if (subjects.indexOf(subject) == -1) {
      if(subjects.length!=0){
        html += subjectEnd
      }
      const subjectId = "hex" + parser.toHex(subject)
      html += `
      <div class="list-group">
        <ul id="${subjectId}">
          <li class="list-group-title">${subject}</li>
      `
      subjects.push(subject)
    }
    html+=parser.parseHomeworkSubject(homework)
  }
    if(html==""){
      return "<div style='text-align: center;font-size:2em;margin:0.67em'>No homework yay</div>"
    }
    html+="</div></ul>"
    return html
}
parser.parseHomeworkSubject = function(homework) {
  const {
    id,
    iconColor,
    bgColor,
    icon,
    text,
    displayDate,
    dueDate2,
    extra
  } = parser.parseHomeworkMetaData(homework)
  return `
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
      <div class="swipeout-actions-left">
        <a onclick="lastTouched = this.parentElement.parentElement;loadDetails()" class="swipeout-close swipeout-overswipe" style="background-color:#2196f3">Info</a>
      </div>
      <div class="swipeout-actions-right">
        <a href="/popups/edit/?edit=true" class="swipeout-close swipeout-edit-button" style="background-color:#ff9800">Edit</a>
        <a onclick="lastTouched = this.parentElement.parentElement;startDelete()" class="swipeout-close" style="background-color:#f44336">Delete</a>
      </div>
    </li> 
  `
}
parser.parseByDate = function(data,order=0) {
  data = data.sort(function(a,b){
    if(a.dueDate>b.dueDate){
      return -1
    }else{
      return 1
    }
  })
  if(!order){
    data = data.reverse()
  }
  let dates = []
  let html = ""
  const dateEnd = `</ul></div>`
  for (let homework of data) {
    let {displayDate,dueDate2,daysLeft} = parser.parseHomeworkMetaData(homework)
    if (dates.indexOf(displayDate) == -1) {
      if(dates.length!=0){
        html += dateEnd
      }
      html += `
      <div class="list-group">
        <ul style="padding: 0px" id="${daysLeft}">
          <li class="list-group-title">${displayDate} (${Sugar.Date.format(dueDate2,"{d}/{M}")})</li>
      `
      dates.push(displayDate)
    }
    html+=parser.parseHomeworkDate(homework)
  }
  if(html==""){
    return "<div style='text-align: center;font-size:2em;margin:0.67em'>No homework yay</div>"
  }
  html+="</div></ul>"
  return html
}
parser.parseHomeworkDate = function(homework) {
  const {
    subject,
    id,
    iconColor,
    bgColor,
    icon,
    text,
    extra
  } = parser.parseHomeworkMetaData(homework)
  return `
  <li class="hwitem swipeout" sqlID="${id}" style="color:${iconColor};background-color:${bgColor}">
  <div class="swipeout-content item-content">
    <div class="item-media">
        <i class="material-icons" style="color:${iconColor}" aria-hidden="true">${icon}</i>
    </div>
    <div class="item-inner">
      <div class="item-title">
        ${text}
        <div class="item-footer">
          ${subject}${extra}
        </div>
      </div>
    </div>
  </div>
  <div class="swipeout-actions-left">
    <a onclick="lastTouched = this.parentElement.parentElement;loadDetails()" class="swipeout-close swipeout-overswipe" style="background-color:#2196f3">Info</a>
  </div>
  <div class="swipeout-actions-right">
    <a href="/popups/edit/?edit=true" class="swipeout-close swipeout-edit-button" style="background-color:#ff9800">Edit</a>
    <a onclick="lastTouched = this.parentElement.parentElement;startDelete()" class="swipeout-close" style="background-color:#f44336">Delete</a>
  </div>
</li>
  `
} 
parser.toTitle = function(str)
{
return str.substring(0,1).toUpperCase()+str.substring(1,10000)
}
parser.toHex = function(str){
  var hex, i;

  var result = "";
  for (i=0; i<str.length; i++) {
      hex = str.charCodeAt(i).toString(16);
      result += (hex).slice(-4);
  }

  return result
}
parser.parseHomeworkMetaData =  function(homework){
  let {
    id,
    subject,
    dueDate,
    isTest,
    text,
    lastEditPerson: editPerson,
    lastEditTime: editTime
  } = homework
  text = text.replace(/ *\([^)]*\) */g, "");
  let dueDate2 = Sugar.Date.create(dueDate)
  let daysLeft = Sugar.Date.daysUntil(Sugar.Date.create("Today"), Sugar.Date.create(Sugar.Date.format(dueDate2, "{d}/{M}"), "en-GB"))
  let iconColor = ""
  if (Sugar.Date.isToday(dueDate2)) {
    daysLeft = 0
    iconColor = "red"
  } else if (Sugar.Date.isTomorrow(dueDate2)) {
    iconColor = "#ab47bc"
  }
  let icon = ""
  let bgColor = ""
  let extra = ""
  if (isTest) {
    icon = "&#xe900;"
    bgColor = "#bbdefb"
    extra = ", Graded"
  } else {
    icon = "&#xe873;"
  }
  let displayDate
  switch (daysLeft) {
    case 0:
      displayDate = "Due today"
      break;
    case 1:
      displayDate = "Due tomorrow"
      break;
    default:
      displayDate = `${daysLeft} days left`
  }
  if (isTest) {
    displayDate = parser.toTitle(displayDate.replace("Due ", ""))
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
    extra
  }
}
const renderer = function(data,sortType="Due date",sortOrder=0){
if(sortType=="Due date"){
  return parser.parseByDate(data,sortOrder)
}else{
  return parser.parseBySubject(data,sortOrder)
}
}
if(typeof navigator=="undefined"){
  module.exports =  renderer
}