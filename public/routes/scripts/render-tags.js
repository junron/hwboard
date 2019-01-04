function renderTags(data){
  const {tags} = data;
  let html = "";
  for(const tag in tags){
    const tagTextColor = tinycolor.readability(tags[tag],"#fff")<2 ? "black" : "white";
    html+=`<li class="item-content">
      <div class="item-inner">
        <div class="chip item-title" 
        style="font-size:13px;background-color:${tags[tag]};color:${tagTextColor}">
            ${tag}
        </div>
      </div>
      </li>`;
  }
  return html;
}