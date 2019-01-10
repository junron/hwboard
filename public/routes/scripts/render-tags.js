function renderTags(data){
  const currentPerson = getCookie("email");
  const isRoot = data.roots.includes(currentPerson);
  const {tags} = data;
  let html = "";
  for(const tag in tags){
    const tagTextColor = tinycolor.readability(tags[tag],"#fff")<2 ? "black" : "white";
    html+=`<li class="swipeout item-content">
      <div class="swipeout-content item-content">
        <div class="item-inner">
          <div class="chip item-title" style="font-size:13px;background-color:${tags[tag]};color:${tagTextColor}">
              ${tag}
          </div>
        </div>
      </div>`;
    if(isRoot){
      html+=`<div class="swipeout-actions-right">
  <a onclick="deleteTag(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#f44336">Delete</a>
  </div>`;
    }
    html += `</li>`;
  }
  return html;
}