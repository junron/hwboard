let channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
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
//Load cached data before websocket connects
//Allows for faster loading of updated data
worker.postMessage({
  type:"get",
}).then(data=>{
  if(channel!=""){
    //Only show homework for current channel
    data = data.filter(a=>a.channel == channel)
  }
  if(!data.length){
    //IndexedDB is empty, perhaps is first page load
    return
  }
  reRender(data)
})