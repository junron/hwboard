let channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
let timetable = {}
let subjectChannelMapping = {}
let subjectSelectionList = []
let channelSettings
if(channel==""){
  channelSettings = {}
}else{
  channelSettings = {
    channel,
    removeExpired:true
  }
}

//Homework sorting options
const sortOptions = {
  type:getCookie("sortType") || "Due date",
  order:parseInt(getCookie("sortOrder")) || 0
}
//Web worker for indexedDB
//Use promise based messaging
const worker = new PromiseWorker(new Worker("/scripts/worker.js"))
console.log("Worker created:",worker)