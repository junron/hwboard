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
const newPerson = (name,email)=>`<li class="swipeout item-content">
  <div class="swipeout-content item-content">
    <div class="item-inner">
      <div class="item-title person-name">
          ${name}
          <div class="item-footer person-email">
              ${email}
          </div>
      </div>
    </div>
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
      html += newPerson(name,email)
    }
  }
  return html
}