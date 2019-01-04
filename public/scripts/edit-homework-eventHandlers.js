const initEditHomeworkEvents = ()=>{
  const entered = (event) => {
    if(event.key=="Enter"){
      const elem = document.getElementById("update-hwboard-button");
      if(elem.disabled){
        return;
      }
      updateHomework();
      elem.disabled = true;
    }
  };
  //Simulate a click event when user enters
  $("#homework-name").keypress(entered);
  
  //User clicked the update hwboard button
  $(document).on("click","#update-hwboard-button",updateHomework);
  
  function updateHomework(){
    //Prevent user from double clicking
    const elem = document.getElementById("update-hwboard-button");
    elem.disabled = true;
    let actionPromise;
    if($(".page-current #edit-title").text()=="Edit homework"){
      actionPromise = editHomework();
    }else{
      actionPromise = addHomework();
    }
    //The error handling should be the same
    actionPromise.then(_=>{
      setTimeout(()=>{
        elem.disabled = false;
        reset();
        mainView.router.back();
      },100);
    }).catch(e=>{
      console.error(e);
      const errorAlert = Framework7App.dialog.alert(e.toString());
      errorAlert.on("closed",()=>{
        elem.disabled = false;
      });
    });
  }
  $(document).on("input","#dueDate",()=>{
    dateParser.parseDate().then(date=>{
      $(".date-input").removeClass("item-input-invalid");
      $("#due-date-validation-err").text("");
      $("#date-input-info").text(`${Sugar.Date.format(date,"%d/%m/%Y %H:%M")}, ${dateParser.daysUntil(date)} days time`);
    }).catch(err=>{
      $(".date-input").addClass("item-input-invalid");
      $("#due-date-validation-err").text(err.message);
    });
  });


  //DropDown for subjects
  const options = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
  };
  const indexToString = index => subjectSelectionList[index];
  let subjectDropDown;
  Framework7App.loadModules(["autocomplete","list-index"]).then(()=>{
    let fuse = new Fuse(subjectSelectionList,options);
    subjectDropDown = Framework7App.autocomplete.create({
      openIn:"dropdown",
      source:(query,render)=>{
        if(query==""){
          fuse = new Fuse(subjectSelectionList,options);
          return render(subjectSelectionList);
        }else{
          const result = fuse.search(query).map(indexToString);
          return render(result);
        }
      },
      inputEl:"#subject-name"
    });
    subjectDropDown.on("close",subjectChanged);
  });
  const subjectChanged = ()=>{
    const subjectName = $("#subject-name").val();
    if($("#dueDate").val().trim()!==""){
      $("#dueDate").trigger("input");
    }
    if(subjectSelectionList.includes(subjectName)){
      $("#selectTagsElem").removeClass("disabled");
      const tags = Object.keys(subjectTagMapping[subjectName]);
      $("#selectTagsElem select").html(tags.map(tag=>`<option>${tag}</option>`).join(""));
    }else{
      $("#selectTagsElem").addClass("disabled");
    }
  };
  $("#subject-name").keypress(subjectChanged);
  Framework7App.loadModules(["smart-select","checkbox"]).then(()=>{
    Framework7App.smartSelect.create({
      el:document.getElementById("selectTagsElem"),
      openIn:"popup"
    });
  });
};
