import 
{
  getData,
  getStudentByIdSync

} from "/scripts/students.js"

const newRole = role => `<li class="item-content item-divider">
  <div class="item-inner">
    <div class="item-title">
      ${role}
    </div>
    </div>
</li>`
<<<<<<< HEAD
const newPerson = (name,email,permission,isRoot)=>{
  let person = `<li class="swipeout item-content">
=======
const newPerson = (name,email)=>`<li class="swipeout item-content">
>>>>>>> 227e9e8f99485878ada64f9757eb672c71247d7b
  <div class="swipeout-content item-content">
    <div class="item-inner">
      <div class="item-title person-name">
          ${name}
          <div class="item-footer person-email">
              ${email}
          </div>
      </div>
    </div>
<<<<<<< HEAD
  </div>`
  if(isRoot){
    if(permission!="Roots"){
    person+=`<div class="swipeout-actions-left">
      <a onclick="promoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#4caf50">Promote</a>
    </div>`
    }
    person+=`<div class="swipeout-actions-right">`
    if(permission!="Members"){
      person+=`<a onclick="demoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#ff9500">Demote</a>`
    }
    person+=`<a onclick="deleteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#f44336">Delete</a>
    </div>`
  }
  person += `</li>`
  return person
}

export async function render(channelData){
  const currentPerson = getCookie("email")
  const isRoot = channelData.roots.includes(currentPerson)
=======
  </div>
  <div class="swipeout-actions-left">
    <a onclick="promoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#4caf50">Promote</a>
  </div>
  <div class="swipeout-actions-right">
    <a onclick="demoteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#ff9500">Demote</a>
    <a onclick="deleteMember(this.parentElement.parentElement)" class="swipeout-close" style="background-color:#f44336">Delete</a>
  </div>
</li>`

export async function render(channelData){
>>>>>>> 227e9e8f99485878ada64f9757eb672c71247d7b
  await getData("/scripts/data.json")
  console.log("Data fetched")
  let html = ""
  const roles = ["Roots","Admins","Members"]
  for (const role of roles){
    const key = role.toLowerCase()
    html += newRole(role)
    for(const email of channelData[key]){
      const id = email.replace("@nushigh.edu.sg","")
      let name
      try{
        name = getStudentByIdSync(id).name
      }catch(e){
        console.log(e)
        name = id
      }
<<<<<<< HEAD
      html += newPerson(name,email,role,isRoot)
=======
      html += newPerson(name,email)
>>>>>>> 227e9e8f99485878ada64f9757eb672c71247d7b
    }
  }
  return html
}