function reset(){
  //Reset all edit dialog options to default
  //$("#edit-dialog-label").text("Add homework")
  $("#subject-name").val("")
  $("#dueDate").val("")
  $("#date-input-info").text('Relative dates such as "next lesson" are accepted')
  $("#homework-name").val("")
  document.getElementById("toggle-is-graded-checkbox").checked = false
  const textInputSelectors = ["#subject-name","#dueDate","#homework-name"]
  textInputSelectors.forEach(removeFloating)
  gradedCheckboxChecked = false
}

const removeFloating = elem=>{
  if(elem instanceof jQuery){
    return elem.parents().removeClass("item-input-with-value")
  }else{
    return $(elem).parents().removeClass("item-input-with-value")
  }
}
const addFloating = elem=>{
  if(!(elem instanceof jQuery)){
    elem = $(elem)
  }
  const parents = elem.parents("li.item-content.item-input")
  parents.addClass("item-input-with-value")
}

//use id=true to get id as well, eg for edit
async function getHomeworkData(id=false){
  const subject = $("#subject-name").val().trim()
  if(subject===""){
    throw new Error("No subject selected")
  }
  const isTest = gradedCheckboxChecked
  //Remove lines
  const text = $("#homework-name").val().split("\n").join("").trim()
  const channel = subjectChannelMapping[subject]
  if(channel==undefined){
    throw new Error("Subject is not valid")
  }
  const date = await parseDate()
  const dueDate = date.getTime()
  if(text==""){
    throw new Error("Homework name not specified")
  }
  if(id){
    const id = parseInt($(lastTouched).attr("sqlid"))
    return {
      subject,
      text,
      isTest,
      id,
      dueDate,
      channel
    }
  }
  return {
    subject,
    text,
    isTest,
    dueDate,
    channel
  }
}

//load form with options
function load(subject,graded,text,dueDate,title){
  subject = subject.trim()
  //$("#edit-dialog-label").text(title)
  $("#subject-name").val(subject)
  //Keep the time also
  $("#dueDate").val(Sugar.Date.format(new Date(dueDate),"%d/%m/%Y %H:%M"))
  $("#homework-name").val(text.trim())
  parseDate()
  if(graded){
    document.getElementById("toggle-is-graded-checkbox").checked = true
    gradedCheckboxChecked = true
  }else{
    document.getElementById("toggle-is-graded-checkbox").checked = false
    gradedCheckboxChecked = false
  }
  const textInputSelectors = ["#subject-name","#dueDate","#homework-name"]
  textInputSelectors.forEach(addFloating)
  editPopup.open()
}

//Load edit dialog
function startEdit(){
  $("#update-hwboard-button").addClass("editing-homework")
  getExistingInfo().then(data =>{
    const {subject,isTest,text,dueDate} = data
    load(subject,isTest,text,dueDate,"Edit homework")
  })
}

async function addHomework(){
  $("#update-hwboard-button").removeClass("editing-homework")
  const homework = await getHomeworkData()
  conn.emit('addReq',homework,function(err){
    if(err) throw err
    //TODO: tell user that operation succeeded
  })
}
async function editHomework(){
  $("#update-hwboard-button").removeClass("editing-homework")
  const homework = await getHomeworkData(true)
  conn.emit('editReq',homework,function(err){
    if(err) throw err
    //TODO: tell user that operation succeeded
  })
}
function startDelete(){
  Framework7App.dialog.confirm("Are you sure you want to delete this homework?","Deletion confirmation",()=>{
    deleteHomework()
  })
}
function deleteHomework(){
  getExistingInfo().then(homeworkData=>{
    const {id,channel} = homeworkData
    conn.emit('deleteReq',{
      id,
      channel
    },(err)=>{
      if (err) throw err;
      //TODO: tell user that operation succeeded
    })
  })
}