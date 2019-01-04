(async ()=>{
  const permissionOptions = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3
  };
  const promisifiedSocketio = (...data)=>{
    return new Promise((resolve,reject)=>{
      conn.emit("studentDataReq",...data,(err,data)=>{
        if(err){
          return reject(err);
        }else{
          return resolve(data);
        }
      });
    });
  };
  const permissionLvls = ["Root","Admin","Member"];


  Framework7App.autocomplete.create({
    openIn:"dropdown",
    renderItem:(item,index)=>{
      if(searchData && typeof searchData[index].mentorGrp==="string"){
        return `<li>
        <label class="item-radio item-content" data-value="${item.value}">
        <div class="item-inner">
        <div class="item-title">
          ${item.text}
        <div class="item-footer">
          ${searchData[index].id}, ${searchData[index].mentorGrp}
        </div>
        </div>
        </div>
        </label>
        </li>
        `;
      }else{
        return `<li>
        <label class="item-radio item-content" data-value="${item.value}">
        <div class="item-inner">
        <div class="item-title">
          ${item.text}
        <div class="item-footer">
          ${searchData[index].info}
        </div>
        </div>
        </div>
        </label>
        </li>
        `;
      }
    },
    source:async (query,render)=>{
      const result = await promisifiedSocketio({
        method:"searchStudents",
        data:query
      });
      if(result.type=="empty"){
        return render([]);
      }
      searchData = result.data;
      return render(result.data.map(value => value.name));
    },
    inputEl:"#searchInput"
  });

  const getElemAtIndex = array => index => array[index];
  const getPermissionFromIndex = getElemAtIndex(permissionLvls);

  //Permission dropdown
  const permissionFuse = new Fuse(permissionLvls,permissionOptions);
  const permissionLvlDropdown = Framework7App.autocomplete.create({
    openIn:"dropdown",
    inputEl:"#permissionLvlInput",
    source:(query,render)=>{
      if(query==""){
        return render(permissionLvls);
      }
      const result = permissionFuse.search(query).map(getPermissionFromIndex);
      return render(result);
    },
  });
})();


async function getResult(){
  const promisifiedSocketio = (...data)=>{
    return new Promise((resolve,reject)=>{
      conn.emit("studentDataReq",...data,(err,data)=>{
        if(err){
          return reject(err);
        }else{
          return resolve(data);
        }
      });
    });
  };
  const permissionLvls = ["Root","Admin","Member"];
  const idOnly = student => student.id;
  let studentsArray;
  const mentorGrps = await promisifiedSocketio({
    method:"getClasses",
    data:""
  });
  const mgPrefix = mentorGrps[0].substring(0,3);
  const input = document.getElementById("searchInput").value;
  const permissionLvl = document.getElementById("permissionLvlInput").value;
  if(input.toUpperCase().substring(0,3)==mgPrefix){
    studentsArray = await promisifiedSocketio({
      method:"getStudentsByClassName",
      data:input.toUpperCase()
    });
  }else{
    studentsArray = [await promisifiedSocketio({
      method:"getStudentByName",
      data:input
    })].map(idOnly);
  }
  if(!permissionLvls.includes(permissionLvl)){
    throw new Error("Permission level invalid");
  }
  return {students:studentsArray,permissions:permissionLvl};
}
document.getElementById("add-member").addEventListener("click",()=>{
  getResult().then(data=>{
    //send data to websocket
    console.log(data);
    data.permissions = data.permissions.toLowerCase();
    data.channel = channel;
    conn.emit("addMember",data,(err)=>{
      if(err) throw new Error(err);
      mainView.router.back();
    });
  }).catch(e=>{
    console.log(e);
    Framework7App.dialog.alert(e.message);
  });
});