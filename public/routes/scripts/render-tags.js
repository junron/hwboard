function renderTags(data){
  function picktextColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (Math.round(((r * 0.299) + (g * 0.587) + (b * 0.114))) >= 180) ?
      darkColor : lightColor;
  }
  const {tags} = data
  let html = ""
  for(const tag in tags){
    const tagTextColor = picktextColor(tags[tag],"white","black")
    html+=`<li class="item-content">
      <div class="item-inner">
        <div class="chip item-title" 
        style="font-size:14px;background-color:${tags[tag]};color:${tagTextColor}">
            ${tag}
        </div>
      </div>
      </li>`
  }
  return html
}