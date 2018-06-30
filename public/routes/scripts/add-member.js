;(async ()=>{
  const options = {
    shouldSort: true,
    threshold: 0.4,
    includeScore: true,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: [
      "id",
      "name"
    ]
  }
  const permissionOptions = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3
  }
  const permissionLvls = ["Root","Admin","Member"]
  const studentData = await studentsExport.getData("/scripts/data.json")
  const mentorGrps = studentsExport.getClassesSync()
  let studentIds
  const getName = object => object.item.name
  const getId = object => object.item.id
  //Love currying
  const getElemAtIndex = array => index => array[index]
  const getPermissionFromIndex = getElemAtIndex(permissionLvls)
  const getMgFromIndex = getElemAtIndex(mentorGrps)
  const fuse = new Fuse(studentData, options)
  const mgPrefix = mentorGrps[0].substring(0,3)
  const mentorGrpsFuse = new Fuse(mentorGrps,permissionOptions)


  const namesDropdown= Framework7App.autocomplete.create({
    openIn:"dropdown",
    limit: 3,
    renderItem:(item,index)=>{
      if(item.value.toUpperCase().substring(0,3)==mgPrefix){
        const numStudents = studentsExport.getStudentsByClassNameSync(item.value).length
        return "\n        <li>\n          <label class=\"item-radio item-content\" data-value=\"" + item.value + "\">\n            <div class=\"item-inner\">\n              <div class=\"item-title\">" + (item.text) +"<div class=\"item-footer\">" + numStudents +" students</div>\n </div>\n            </div>\n          </label>\n        </li>\n      ";
      }
      //Must not return a promise
      const studentId = studentIds[index]
      //Had to specially make a synchronous version
      const {mentorGrp} = studentsExport.getStudentByIdSync(studentId)
      //Very long rendering string, dun care
      return "\n        <li>\n          <label class=\"item-radio item-content\" data-value=\"" + item.value + "\">\n            <div class=\"item-inner\">\n              <div class=\"item-title\">" + (item.text) +"<div class=\"item-footer\"><span class=\"studentId\">" + studentId +"</span>, " + mentorGrp+ "</div>\n </div>\n            </div>\n          </label>\n        </li>\n      ";
    },
    source:(query,render)=>{
      if(query.toUpperCase().substring(0,3)==mgPrefix){
        const result = mentorGrpsFuse.search(query).slice(0,3)
        const renderResult = result.map(getMgFromIndex)
        return render(renderResult)
      }
      const result = fuse.search(query).slice(0,3)
      const renderResult = result.map(getName)
      studentIds = result.map(getId)
      return render(renderResult)
    },
    inputEl:"#searchInput"
  })

  const permissionFuse = new Fuse(permissionLvls,permissionOptions)
  const permissionLvlDropdown = Framework7App.autocomplete.create({
    openIn:"dropdown",
    inputEl:"#permissionLvlInput",
    source:(query,render)=>{
      if(query==""){
        return render(permissionLvls)
      }
      const result = permissionFuse.search(query).map(getPermissionFromIndex)
      return render(result)
    },
  })
})()


async function getResult(){
  const idOnly = student => student.id
  let studentsArray
  let permissionLevel
  const mentorGrps = studentsExport.getClassesSync()
  const mgPrefix = mentorGrps[0].substring(0,3)
  const input = document.getElementById("searchInput").value
  const permissionLvl = document.getElementById("permissionLvlInput").value
  if(input.toUpperCase().substring(0,3)==mgPrefix){
    studentsArray = await studentsExport.getStudentsByClassName(input.toUpperCase())
  }else{
    studentsArray = [await studentsExport.getStudentByName(input)].map(idOnly)
  }
  if(!permissionLvls.includes(permissionLvl)){
    throw new Error("Permission level invalid")
  }
  return {students:studentsArray,permissions:permissionLvl}
}
document.getElementById("add-member").addEventListener("click",()=>{
  getResult().then(data=>{
    //send data to websocket
    console.log(data)
    data.permissions = data.permissions.toLowerCase()
    data.channel = channel
    conn.emit("addMember",data,(err)=>{
      if(err) throw new Error(err)
      mainView.router.back()
    })
  }).catch(e=>{
    console.log(e)
    Framework7App.dialog.alert(e.message)
  })
})