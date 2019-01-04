function renderSubjects(data){
  const currentPerson = getCookie("email");
  const isRoot = data.roots.includes(currentPerson);
  const {subjects} = data;
  let html = "";
  for(const subject of subjects){
    html+=`<li class="swipeout item-content">
    <div class="swipeout-content item-content">
      <div class="item-inner">
        <div class="item-title">
            ${subject}
        </div>
      </div>
    </div>`;
    if(isRoot){
      html+=`<div class="swipeout-actions-right">
      <a onclick="deleteSubject(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#f44336">Delete</a>
      </div>`;
    }
    html += `</li>`;
  }
  return html;
}