//Turns channel data into variables
function setSubjectVariables(channelData, partial = false) {
  if (typeof channelData != "object" || channelData === null || channelData.null) {
    return false;
  }
  if (partial) {
    const channel = channelData[0];
    timetable = Object.assign(timetable, channel.timetable);
    for (const subject in subjectChannelMapping) {
      if (subjectChannelMapping[subject] === channel.name) {
        if (!channel.subjects.includes(subject)) {
          // Subject was deleted
          delete subjectChannelMapping[subject];
          delete subjectTagMapping[subject];
          delete timetable[subject];
          subjectSelectionList = subjectSelectionList.filter(a => a !== subject);
        } else {
          // Subject still exists
          subjectTagMapping[subject] = channel.tags;
        }
      }
    }
    const existingSubjects = Object.keys(subjectChannelMapping);
    for (const subject of channel.subjects) {
      if (!existingSubjects.includes(subject)) {
        // new subject
        if (channel.permissions >= 2) {
          subjectSelectionList.push(subject);
          subjectChannelMapping[subject] = channel.name;
        }
        subjectTagMapping[subject] = channel.tags;
      }
    }
    dateParser = Object.freeze(dateParserFn(timetable, subjectSelectionList));
    return;
  }
  timetable = {};
  subjectChannelMapping = {};
  subjectSelectionList = [];
  subjectTagMapping = {};
  for (const channelName in channelData) {
    const channel = channelData[channelName];
    timetable = Object.assign(timetable, channel.timetable);
    for (const subject of channel.subjects) {
      //User is admin or higher of channel
      if (channel.permissions >= 2) {
        subjectSelectionList.push(subject);
        subjectChannelMapping[subject] = channel.name;
      }
      subjectTagMapping[subject] = channel.tags;
    }
  }
  dateParser = Object.freeze(dateParserFn(timetable, subjectSelectionList));
}

channelSettings = {
  channel,
  removeExpired: true
};

prevDataHash = "";
//Get cookies
//Re-render homework
async function reRender(data) {
  console.log(data);
  if (data.null) {
    return;
  }
  const sortType = sortOptions.type || getCookie("sortType") || "Due date";
  let sortOrder = sortOptions.order || 0;
  const rendered = renderer(data, sortType, sortOrder);
  $("#hwboard-homework-list").html(rendered);
  console.log("rerendered");
}

async function loadHomework(force = false) {
  const results = await Promise.all([
    hwboard.getHomework(),
    hwboard.getChannelData()
  ]);
  const [homeworkData, channelData] = await Promise.all(results);
  setSubjectVariables(channelData);
  await reRender(homeworkData);
  $(".swipeout-actions-left").css("visibility", "visible");
  $(".swipeout-actions-right").css("visibility", "visible");
}
loadHomework();