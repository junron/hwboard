const channelRenderer = {}

channelRenderer.renderer = channelData =>{
  let html = ""
  for(const channelName in channelData){
    const channel = channelData[channelName]
    html += `<li class="item-content">
    <div class="item-inner">
      <div class="item-title">
          <!--<a href="/channels/${channelName}">-->${channelName}<!--</a>-->
      </div>
      <div class="item-after">
        <a class="button" href="/channels/${channelName}/settings">Settings</a>
        <a class="button" href="/channels/${channelName}/analytics">Stats</a>
      </div>
    </div>
  </li>`
  }
  return html
}

if(typeof navigator=="undefined"){
  module.exports =  channelRenderer.renderer
}
