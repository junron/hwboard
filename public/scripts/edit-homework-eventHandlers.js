let gradedCheckboxChecked = false
const initEditHomeworkEvents = ()=>{
  document.getElementById("toggle-is-graded-checkbox").addEventListener("click",(e)=>{
    gradedCheckboxChecked = !gradedCheckboxChecked
  })
  document.getElementsByClassName("toggle-icon")[0].addEventListener("touchstart",(e)=>{
    gradedCheckboxChecked = !gradedCheckboxChecked
  })

  const entered = (event) => {
    if(event.key=="Enter"){
      const elem = document.getElementById("update-hwboard-button")
      if(elem.disabled){
        return
      }
      updateHomework()
      elem.disabled = true
    }
  }
  //Simulate a click event when user enters
  $("#homework-name").keypress(entered)
  
  //User clicked the update hwboard button
  $(document).on("click","#update-hwboard-button",updateHomework)
  
  function updateHomework(){
    //Prevent user from double clicking
    const elem = document.getElementById("update-hwboard-button")
    elem.disabled = true
    let actionPromise
    if($(".page-current #edit-title").text()=="Edit homework"){
      actionPromise = editHomework()
    }else{
      actionPromise = addHomework()
    }
    //The error handling should be the same
    actionPromise.then(_=>{
      mainView.router.back()
      setTimeout(()=>{
        elem.disabled = false
        reset()
      },100)
    }).catch(e=>{
      console.error(e)
      const errorAlert = Framework7App.dialog.alert(e.toString())
      errorAlert.on("closed",()=>{
        elem.disabled = false
      })
    })
  }
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


  //Dropdown for subjects
  const options = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
  }
  const indexToString = index => subjectSelectionList[index]
  const fuse = new Fuse(subjectSelectionList,options)
  const subjectDropdown= Framework7App.autocomplete.create({
  openIn:"dropdown",
  source:(query,render)=>{
    if(query==""){
      return render(subjectSelectionList)
    }else{
      const result = fuse.search(query).map(indexToString)
      return render(result)
    }
  },
  inputEl:"#subject-name"
})
}
