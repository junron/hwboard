let timer
//Required for all ppl, not just admins
//Attach event listener to elements
const handleStart = event => {
  //We dont want context menu to open on mobile
  const homeworkElems = Array.from(document.getElementsByClassName("hwitem"))
  for (const elem of homeworkElems){
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
  const homeworkElems = document.getElementsByClassName("hwitem")
  const arrayElems = Array.from(homeworkElems)
  //HTMLCollection's symbol.iterator not implemented in safari yet
  for (const elem of arrayElems){
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
$(document).on("mousedown",touchedSomewhereElse)

const radios = Array.from(document.querySelectorAll("input[type='radio']"))
for (const radio of radios){
  radio.addEventListener("change",function(){
    if(this.name in sortOptions){
      console.log(this.name)
      if(this.name=="order"){
        sortOptions[this.name] = parseInt(this.value)
      }else{
        sortOptions[this.name] = this.value
      }
    }
  })
}

let gradedCheckboxChecked = false
document.getElementById("toggle-is-graded-checkbox").addEventListener("click",(e)=>{
  gradedCheckboxChecked = !gradedCheckboxChecked
})
document.getElementsByClassName("toggle-icon")[0].addEventListener("touchstart",(e)=>{
  gradedCheckboxChecked = !gradedCheckboxChecked
})

const entered = (event) => {
  if(event.key=="Enter"){
    $("#updateBtn").click()
  }
}
$("#hwname").keypress(entered)

$(document).on("click","#update-hwboard-button",()=>{
  if($("#update-hwboard-button").hasClass("editing-homework")){
    editHomework().then(_=>{
      editPopup.close()
      setTimeout(reset,100)
    }).catch(e=>{
      Framework7App.dialog.alert(e.message)
    })
  }else{
    addHomework().then(()=>{
      editPopup.close()
      setTimeout(reset,100)
    }).catch(e=>{
      Framework7App.dialog.alert(e.message)
    })
  }
})
$(document).on("click","#cancel-update-hwboard-button",_=>{
  editPopup.close()
  setTimeout(reset,100)
})
$(document).on("input","#dueDate",()=>{
  parseDate().then(date=>{
    $(".date-input").removeClass("item-input-invalid")
    $("#due-date-validation-err").text("")
    $("#date-input-info").text(`${Sugar.Date.format(date,"%d/%m/%Y %H:%M")}, ${daysUntil(date)} days time`)
  }).catch(err=>{
    $(".date-input").addClass("item-input-invalid")
    $("#due-date-validation-err").text(err.message)
  })
})

$(document).on("click","#fab-add-homework",_=>{
  editPopup.open()
})