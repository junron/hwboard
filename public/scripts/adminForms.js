let previousAddedHomework;
function reset(){
  //Reset all edit dialog options to default
  //$("#edit-dialog-label").text("Add homework")
  $(".page-current #subject-name").val("");
  $(".page-current #dueDate").val("");
  $(".page-current #date-input-info").text('Relative dates such as "next lesson" are accepted');
  $(".page-current #homework-name").val("");
  const textInputSelectors = [".page-current #subject-name",".page-current #dueDate",".page-current #homework-name"];
  textInputSelectors.forEach(removeFloating);
}

const removeFloating = elem=>{
  if(elem instanceof jQuery){
    return elem.parents().removeClass("item-input-with-value");
  }else{
    return $(elem).parents().removeClass("item-input-with-value");
  }
};
const addFloating = elem=>{
  if(!(elem instanceof jQuery)){
    elem = $(elem);
  }
  const parents = elem.parents("li.item-content.item-input");
  parents.addClass("item-input-with-value");
};

//use id=true to get id as well, eg for edit
async function getHomeworkData(id=false){
  const subject = $(".page-current #subject-name").val().trim();
  if(subject===""){
    throw new Error("No subject selected");
  }
  const tags = $(".page-current #selectTagsElem .item-inner .item-after").text().split(", ");
  //Remove lines
  const text = $(".page-current #homework-name").val().split("\n").join("").trim();
  const channel = subjectChannelMapping[subject];
  if(channel==undefined){
    throw new Error("Subject is not valid");
  }
  const date = await dateParser.parseDate();
  const dueDate = Number.isNaN(date) ? "Unknown" : date.getTime();
  if(text==""){
    throw new Error("Homework name not specified");
  }
  if(id){
    const id = $(".page-current #homework-id").val();
    return {
      subject,
      text,
      tags,
      id,
      dueDate,
      channel
    };
  }
  return {
    subject,
    text,
    tags,
    dueDate,
    channel
  };
}

//load form with options
function load(subject,tags,text,dueDate,id,pageSelector=".page-current"){
  subject = subject.trim();
  $(`${pageSelector} #subject-name`).val(subject);
  $(`${pageSelector} #homework-id`).val(id);
  $(`${pageSelector} #selectTagsElem`).removeClass("disabled");
  const availableTags = Object.keys(subjectTagMapping[subject]);
  $(`${pageSelector} #selectTagsElem select`).html(availableTags.map(tag=>{
    return `<option ${tags.includes(tag) ? "selected" : ""}>${tag}</option>`;
  }).join(""));
  //Keep the time also
  $(`${pageSelector} #dueDate`).val(new Date(dueDate).getFullYear()===2099 ? "Unknown" : Sugar.Date.format(new Date(dueDate),"%d/%m/%Y %H:%M"));
  $(`${pageSelector} #homework-name`).val(text.trim());
  dateParser.parseDate(dueDate);
  const textInputSelectors = [`${pageSelector} #subject-name`,`${pageSelector} #dueDate`,`${pageSelector} #homework-name`];
  textInputSelectors.forEach(addFloating);
}

//Load edit dialog
function startEdit(elem,pageSelector=".page-next"){
  getExistingInfo(elem).then(data =>{
    const {subject,tags,text,dueDate,id} = data;
    load(subject,tags,text,dueDate,id,pageSelector);
  });
}

async function backgroundSync(url,body){
  async function hash(data){
    const bytes = await crypto.subtle.digest("SHA-512",new TextEncoder("utf-8").encode(data));
    return btoa(new Uint8Array(bytes).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  }
  return new Promise(async (resolve,reject)=>{
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const swRegistration = await navigator.serviceWorker.ready;

      let previousHomeworkHash;
      let action;
      if(url.includes("add")){
        action="added";
        const allHomework = await worker.postMessage({
          type:"get"
        });
        previousHomeworkHash = await hash(JSON.stringify(allHomework.filter(a=>a.subject===body.subject && a.channel===body.channel)));
      }else if(url.includes("edit")){
        action="edited";
      }else if(url.includes("delete")){
        action="deleted";
      }

      if(previousHomeworkHash===undefined){
        const homework = await worker.postMessage({
          type:"getSingle",
          id:body.id
        });
        console.log(JSON.stringify([homework]));
        previousHomeworkHash = await hash(JSON.stringify([homework]));
      }
      body.previousHomeworkHash = previousHomeworkHash;

      if(Notification.permission!=="granted"){
        //Request notifications for background sync
        await new Promise((ok,cancel)=>{
          Framework7App.dialog.confirm("You are currently offline.\nTo enable homework to be synced as soon as you get online, notifications need to be enabled.","Background sync",async ()=>{
            const result = await Notification.requestPermission();
            if (result !== 'granted') {
              return reject(new Error("Notification permission not granted."));
            }
            const title = "Hwboard";
            const notifOptions = {
              icon:"/images/icons/favicon.png",
              body:`Your homework will be ${action} as soon as you are online.`,
            };
            swRegistration.showNotification(title,notifOptions);
            return ok();
          },cancel);
        });
      }else{
        Framework7App.dialog.confirm("You are currently offline. Your homework will be "+action+" ASAP.");
      }
      console.log({type:"sync",
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
      });
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
      });
      return resolve(id);
    }else{
      reject("Background sync not available");
    }
  });
}

async function addHomework(){
  $("#update-hwboard-button").removeClass("editing-homework");
  const homework = await getHomeworkData();
  if(JSON.stringify(previousAddedHomework)==JSON.stringify(homework)){
    console.log("Repeated request rejected");
    return;
  }
  previousAddedHomework = homework;
  if(navigator.onLine===false){
    console.log("bg");
    return backgroundSync("/api/addReq",homework);
  }
  const promise = new Promise(function(resolve,reject){
    conn.emit('addReq',homework,function(err){
      if(err) return reject(err);
      //TODO: tell user that operation succeeded
      return resolve();
    });
  });
  return promise;
}
async function editHomework(){
  $("#update-hwboard-button").removeClass("editing-homework");
  const homework = await getHomeworkData(true);
  if(navigator.onLine===false){
    return backgroundSync("/api/editReq",homework);
  }
  const promise = new Promise(function(resolve,reject){
    conn.emit('editReq',homework,function(err){
      if(err) return reject(err);
      //TODO: tell user that operation succeeded
      return resolve();
    });
  });
  return promise;
}
function startDelete(element){
  Framework7App.dialog.confirm("Are you sure you want to delete this homework?","Deletion confirmation",()=>{
    deleteHomework(element);
  });
}
function deleteHomework(element){
  getExistingInfo(element).then(homeworkData=>{
    if(navigator.onLine===false){
      backgroundSync("/api/deleteReq",homeworkData).then(console.log);
      return;
    }
    conn.emit('deleteReq',homeworkData,(err)=>{
      if(err) throw err;
      console.log("Homework deleted");
    });
  });
}