const channelRenderer = {};

channelRenderer.renderer = channelData =>{
  const channelNames = Object.keys(channelData).sort();
  let html = "";
  for(const channelName of channelNames){
    html += `<li class="item-content">
    <div class="item-inner">
      <div class="item-title">
          ${channelName}
      </div>
      <div class="item-after">
        <a class="button" href="/channels/${channelName}/settings">Settings</a>
        <a class="button" href="/channels/${channelName}/analytics">Stats</a>
      </div>
    </div>
  </li>`;
  }
  return html;
};

if(typeof navigator=="undefined"){
  module.exports =  channelRenderer.renderer;
}
