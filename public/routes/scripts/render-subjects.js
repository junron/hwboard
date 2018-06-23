export function renderSubjects(subjects){
  let html = ""
  for(const subject of subjects){
    html+=`<li class="item-content">
      <div class="item-inner">
        <div class="item-title">
            ${subject}
        </div>
      </div>
    </li>`
  }
  return html
}