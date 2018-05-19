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

function applyHwEventHandlers(){
  for (let elem of document.getElementsByClassName("hwitem")){
    elem.addEventListener("mousedown",handleStart)
    elem.addEventListener("touchstart",handleStart)
    elem.addEventListener("mouseup",handleEnd)
    elem.addEventListener("mouseleave",handleEnd)
    elem.addEventListener("touchend",handleEnd)
  }
}
applyHwEventHandlers()

//Hide toolbar when user clicks somewhere else
//Requires jQuery, defer loading
const touchedSomewhereElse = event =>{
  if(!$(event.target).closest('#editMenu').length) {
    if($('#editMenu').css("display")=="block") {
      $('#editMenu').css("display","none")
      $('#normalToolbar').css("display","initial")
      $(".mdc-toolbar").css("background-color","#6200ee")
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