const renderAdmins = (()=>{
  const newRole = role => `<li class="item-content item-divider">
  <div class="item-inner">
    <div class="item-title">
      ${role}
    </div>
    </div>
  </li>`;
  const newPerson = (name,email,permission,isRoot)=>{
    let person = `<li class="swipeout item-content">
    <div class="swipeout-content item-content">
      <div class="item-inner">
        <div class="item-title person-name">
            ${name}
            <div class="item-footer person-email">
                ${email}
            </div>
        </div>
      </div>
    </div>`;
    if(isRoot){
      if(permission!="Roots"){
        person+=`<div class="swipeout-actions-left">
        <a onclick="promoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#4caf50">Promote</a>
      </div>`;
      }
      person+=`<div class="swipeout-actions-right">`;
      if(permission!="Members"){
        person+=`<a onclick="demoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#ff9500">Demote</a>`;
      }
      person+=`<a onclick="deleteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#f44336">Delete</a>
      </div>`;
    }
    person += `</li>`;
    return person;
  };
  const studentDataCache = {};
  const promisifiedSocketio = (...data)=>{
    return new Promise((resolve,reject)=>{
      const key = data[0].method+data[0].data;
      if(studentDataCache[key]){
        console.log("cacheHit");
        return resolve(studentDataCache[key]);
      }
      if(!navigator.onLine){
        reject("Cannot load student data offline");
      }
      conn.emit("studentDataReq",...data,(err,data)=>{
        if(err){
          return reject(err);
        }else{
          studentDataCache[key] = data;
          return resolve(data);
        }
      });
    });
  };
  async function render(channelData){
    const currentPerson = getCookie("email");
    const isRoot = channelData.roots.includes(currentPerson);
    console.log("Data fetched");
    let html = "";
    const roles = ["Roots","Admins","Members"];
    for (const role of roles){
      const key = role.toLowerCase();
      html += newRole(role);
      for(const email of channelData[key].sort()){
        const id = email.replace("@nushigh.edu.sg","");
        let name;
        try{
          ({name} = await promisifiedSocketio({
            method:"getStudentById",
            data:id
          }));
        }catch(e){
          console.log(e);
          name = id;
        }
        html += newPerson(name,email,role,isRoot);
      }
    }
    return html;
  }
  return Object.freeze({
    render
  });
})();