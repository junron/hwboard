let previousAddedHomework
function reset(){
  //Reset all edit dialog options to default
  //$("#edit-dialog-label").text("Add homework")
  $(".page-current #subject-name").val("")
  $(".page-current #dueDate").val("")
  $(".page-current #date-input-info").text('Relative dates such as "next lesson" are accepted')
  $(".page-current #homework-name").val("")
  document.getElementById("toggle-is-graded-checkbox").checked = false
  const textInputSelectors = [".page-current #subject-name",".page-current #dueDate",".page-current #homework-name"]
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
  const subject = $(".page-current #subject-name").val().trim()
  if(subject===""){
    throw new Error("No subject selected")
  }
  const isTest = gradedCheckboxChecked
  //Remove lines
  const text = $(".page-current #homework-name").val().split("\n").join("").trim()
  const channel = subjectChannelMapping[subject]
  if(channel==undefined){
    throw new Error("Subject is not valid")
  }
  const date = await dateParser.parseDate()
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
function load(subject,graded,text,dueDate,pageSelector=".page-current"){
  subject = subject.trim()
  $(`${pageSelector} #subject-name`).val(subject)
  //Keep the time also
  $(`${pageSelector} #dueDate`).val(Sugar.Date.format(new Date(dueDate),"%d/%m/%Y %H:%M"))
  $(`${pageSelector} #homework-name`).val(text.trim())
  dateParser.parseDate()
  if(graded){
    $(`${pageSelector} #toggle-is-graded-checkbox`).attr("checked",true)
    gradedCheckboxChecked = true
  }else{
    $(`${pageSelector} #toggle-is-graded-checkbox`).attr("checked",false)
    gradedCheckboxChecked = false
  }
  const textInputSelectors = [`${pageSelector} #subject-name`,`${pageSelector} #dueDate`,`${pageSelector} #homework-name`]
  textInputSelectors.forEach(addFloating)
}

//Load edit dialog
function startEdit(){
  getExistingInfo().then(data =>{
    const {subject,isTest,text,dueDate} = data
    console.log(data)
    load(subject,isTest,text,dueDate,".page-next")
  })
}

async function backgroundSync(url,body){
  return new Promise(async (resolve,reject)=>{
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const swRegistration = await navigator.serviceWorker.ready

      let action
      if(url.includes("add")){
        action="added"
      }else if(url.includes("edit")){
        action="edited"
      }else if(url.includes("delete")){
        action="deleted"
      }

      if(Notification.permission!=="granted"){
        //Request notifications for background sync
        await new Promise((ok,cancel)=>{
          Framework7App.dialog.confirm("You are currently offline.\nTo enable homework to be synced as soon as you get online, notifications need to be enabled.","Background sync",async ()=>{
            const result = await Notification.requestPermission()
            if (result !== 'granted') {
              return reject(new Error("Notification permission not granted."))
            }
            const title = "Hwboard"
            const notifOptions = {
              icon:"/images/icons/favicon.png",
              body:`Your homework will be ${action} as soon as you are online.`,
            }
            swRegistration.showNotification(title,notifOptions)
            return ok()
          },cancel)
        })
      }else{
        Framework7App.dialog.confirm("You are currently offline. Your homework will be "+action+" ASAP.")
      }
      const id = promiseServiceWorker.postMessage({type:"sync",
        data:{
          url,
          options:{
              method:"POST",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body:JSON.stringify(body)
            }
        }
      })
      return resolve(id)
    }else{
      reject("Background sync not available")
    }
  })
}

async function addHomework(){
  $("#update-hwboard-button").removeClass("editing-homework")
  const homework = await getHomeworkData()
  if(JSON.stringify(previousAddedHomework)==JSON.stringify(homework)){
    console.log("Repeated request rejected")
    return
  }
  previousAddedHomework = homework
  if(navigator.onLine===false){
    return backgroundSync("/api/addReq",homework)
  }
  const promise = new Promise(function(resolve,reject){
    conn.emit('addReq',homework,function(err){
      if(err) return reject(err)
      //TODO: tell user that operation succeeded
      return resolve()
    })
  })
  return promise
}
async function editHomework(){
  $("#update-hwboard-button").removeClass("editing-homework")
  const homework = await getHomeworkData(true)
  if(navigator.onLine===false){
    return backgroundSync("/api/editReq",homework)
  }
  const promise = new Promise(function(resolve,reject){
    conn.emit('editReq',homework,function(err){
      if(err) return reject(err)
      //TODO: tell user that operation succeeded
      return resolve()
    })
  })
  return promise
}
function startDelete(){
  Framework7App.dialog.confirm("Are you sure you want to delete this homework?","Deletion confirmation",()=>{
    deleteHomework()
  })
}
function deleteHomework(){
  getExistingInfo().then(homeworkData=>{
    if(navigator.onLine===false){
      backgroundSync("/api/deleteReq",homeworkData).then(console.log)
      return
    }
    const promise = new Promise(function(resolve,reject){
      conn.emit('deleteReq',homeworkData,(err)=>{
        if(err) return reject(err)
        //TODO: tell user that operation succeeded
        return resolve()
      })
    })
  })
}