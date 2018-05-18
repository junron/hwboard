function reset(){
  //Reset all edit dialog options to default
  $("#edit-dialog-label").text("Add homework")
  subjectSelect.selectedIndex=-1
  $("#subject-select").find(".mdc-select__label").removeClass("mdc-select__label--float-above")
  $("#dueDate").val("")
  $("#outdate").text("")
  $("#hwname").val("")
  $("div").off("click")
  $("div").on("click","#updateBtn",addHomework)
  checkbox.checked = false
}


//load form with options
function load(subject,graded,text,dueDate,title){
  editDialog.show()
  setTimeout(function(){checkbox = new MDCCheckbox(document.querySelector('#gradedCheckbox'));},500)
  $("#edit-dialog-label").text(title)
  $("#subject-select").find(".mdc-select__label").addClass("mdc-select__label--float-above")
  subjectSelect.selectedIndex = ["ADMIN", "ANNOUNCEMENTS", "Biology", "Chemistry","Chinese","CS",   "Da-vinci (D&E)", "Da-vinci (SP)", "English","French", "Geography", "Higher Chinese", "Hindi", "Humanities","Japanese", "Math", "Miscellaneous", "PE", "Physics"].indexOf(subject)
  $("#dueDate").val(Sugar.Date.format(new Date(dueDate),"{d}/{M}"))
  $("#hwname").val(text.trim())
  $("div").off("click")
  $("div").on("click","#updateBtn",editHomework)
  parseDate()
  if(graded){
    checkbox.checked = true
  }else{
    checkbox.checked = false
  }

}

//Load edit dialog
function startEdit(){
  getExistingInfo().then(data =>{
    const {subject,isTest,text,dueDate} = data
    load(subject,isTest,text,dueDate,"Edit homework")
  })
}

function addHomework(){
  getHomeworkData().then(homework =>{
    conn.emit('addReq',homework,function(err){
      if(err) throw err
      //TODO: tell user that operation succeeded
    })
  })
  editDialog.close()
}
function editHomework(){
  getHomeworkData(true).then(homework =>{
    conn.emit('editReq',homework,function(err){
      if(err) throw err
      //TODO: tell user that operation succeeded
    })
  })
  editDialog.close()
}

function deleteHomework(){
  const id = parseInt($(lastTouched).attr("sqlid"))
  conn.emit('deleteReq',{
    id
  },(err)=>{
    if (err) throw err;
    //TODO: tell user that operation succeeded
  })
}

//use id=true to get id as well, eg for edit
async function getHomeworkData(id=false){
  if(subjectSelect.selectedOptions[0]==undefined){
    alert("Please select a subject")
    throw new Error("No subject selected")
  }
  const subject = subjectSelect.selectedOptions[0].textContent
  const isTest = checkbox.checked
  //Remove lines
  const text = $("#hwname").val().split("\n").join("")
  const date = parseDate()
  const dueDate = date.getTime()
  if(date==undefined){
    alert("Please specify a valid due date")
    throw new Error("No valid due date specified")
  }
  if(text==""){
    alert("Please specify homework name")
    throw new Error("Homework name not specified")
  }
  if(id){
    const id = parseInt($(lastTouched).attr("sqlid"))
    return {
      subject,
      text,
      isTest,
      id,
      dueDate
    }
  }
  return {
    subject,
    text,
    isTest,
    dueDate
  }
}