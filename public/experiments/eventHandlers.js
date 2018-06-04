let timer
//Required for all ppl, not just admins
//Attach event listener to elements
const handleStart = event => {
  timer = setTimeout(function(){
      lastTouched = event.target
      showEditToolbar()
    }, 1000)
}
const handleEnd = event =>{
  clearTimeout(timer)
}
const rightClick = event =>{
  event.preventDefault()
  menu.setPosition({top:`${event.clientY}px`,left:`${event.clientX}px`})
  menu.open = true
  return false
}
function applyHwEventHandlers(){
  for (let elem of document.getElementsByClassName("hwitem")){
    elem.addEventListener("contextmenu",rightClick,false)
    elem.addEventListener("touchstart",handleStart)
    elem.addEventListener("mouseleave",handleEnd)
    elem.addEventListener("touchend",handleEnd)
  }
}
applyHwEventHandlers()

//Hide toolbar when user clicks somewhere else
//Requires jQuery, defer loading
const touchedSomewhereElse = event =>{
  console.log(event,($(event.target).closest('#editMenu').length+$(event.target).closest('#hw-actions').length))
  if(!($(event.target).closest('#editMenu').length+$(event.target).closest('#hw-actions').length)) {
    if($('#editMenu').css("display")=="block") {
      $('#editMenu').css("display","none")
      $('#normalToolbar').css("display","initial")
      $(".mdc-toolbar").css("background-color","#6200ee")
      menu.open = false
    }
  }
}
$(document).on("mousedown touchstart",touchedSomewhereElse)

const entered = (event) => {
  if(event.key=="Enter"){
    $("#updateBtn").click()
  }
}
$("#hwname").keypress(entered)