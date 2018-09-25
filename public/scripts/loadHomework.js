//Turns channel data into variables
function setSubjectVariables(channelData){
  timetable = {}
  subjectChannelMapping = {}
  subjectSelectionList = []
  for(const channelName in channelData){
    const channel = channelData[channelName]
    timetable = Object.assign(timetable,channel.timetable)
    //User is admin or higher of channel
    if(channel.permissions>=2){
      for (const subject of channel.subjects){
        subjectSelectionList.push(subject)
        subjectChannelMapping[subject] = channel.name
      }
    }
  }
  dateParser = Object.freeze(dateParserFn(timetable,subjectSelectionList))
}

channelSettings = {
  channel,
  removeExpired:true
}

async function loadHomework(){
  const [homeworkData,channelData] = (await Promise.all([hwboard.getHomework(),hwboard.getChannelData()])).map(res=>res.quickest)
  setSubjectVariables(channelData);
  reRender(homeworkData)
}
loadHomework()