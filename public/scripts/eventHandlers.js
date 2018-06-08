let timer
//Required for all ppl, not just admins
//Attach event listener to elements
const handleStart = event => {
  console.log("touched")
  //We dont want context menu to open on mobile
  for (const elem of document.getElementsByClassName("hwitem")){
    elem.removeEventListener("contextmenu",rightClick,false)
  }
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
  lastTouched = event.target
  return false
}
function applyHwEventHandlers(){
  for (let elem of document.getElementsByClassName("hwitem")){
    elem.addEventListener("touchstart",handleStart)
    elem.addEventListener("contextmenu",rightClick,false)
    elem.addEventListener("touchend",handleEnd)
  }
}
applyHwEventHandlers()

//Hide toolbar/context menu when user clicks somewhere else
//Requires jQuery, defer loading
const touchedSomewhereElse = event =>{
  if(!($(event.target).closest('#editMenu').length + $(event.target).closest('#hw-actions').length)) {
    if($('#editMenu').css("display")=="block" || menu.open) {
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