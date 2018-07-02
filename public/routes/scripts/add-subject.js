swiper = Framework7App.swiper.create(".swiper-container",{
  speed:100,
  spaceBetween:0,
  pagination: {
    el: '.swiper-pagination',
  }
})
function canAddTiming(id){
  let can = true
  const currentId = id || document.querySelector(".swiper-slide.swiper-slide-active").id
  const inputs = Array.from(document.querySelectorAll(`#${currentId} input`))
  let day
  for(const input of inputs){
    if(input.classList.contains("day-input")){
      day = input.value
    }else{
      const isValid = Sugar.Date.isValid(Sugar.Date.create(day + " " + input.value))
      if(isValid||input.value==""){
          input.parentElement.parentElement.parentElement.classList.remove("item-input-invalid")
          input.parentElement.querySelector(".item-input-error-message").innerText = ""
      }else{ 
        input.parentElement.parentElement.parentElement.classList.add("item-input-invalid")
        input.parentElement.querySelector(".item-input-error-message").innerText = "Invalid date/time"
      }
      can = can && !!input.value && isValid
    }
  }
  return can
}
function changeStatus(){
  const button = document.getElementById("add-timing-button")
  if(!canAddTiming()){
    button.classList.add("color-gray","disabled")
  }else{
    button.classList.remove("color-gray","disabled")
  }
}
function getTimingData(timingId){
  const data = {}
  let day
  const inputs = Array.from(document.querySelectorAll(`#${timingId} input`))
  for(const input of inputs){
    if(input.classList.contains("day-input")){
      day = Sugar.Date.format(Sugar.Date.create(input.value),"{dow}")
      data[day] = [[]]
    }else{
      const time = parseInt(Sugar.Date.format(Sugar.Date.create(input.value),"%H%M"))
      data[day][0].push(time)
    }
  }
  return data
}
function getData(){
  const data = {}
  const subjectName = document.getElementById("subjectInput").value
  data.subject = subjectName
  data.data = {}
  const timingCount = swiper.slides.length
  for(let i = 1;i<=timingCount;i++){
    const thisId = "timing-"+i
    if(canAddTiming(thisId)){
      const timingData = getTimingData(thisId)
      data.data = Object.assign(data.data,timingData)
    }
  }
  return data
}

function addTiming(){
  const newId = "timing-" + (swiper.slides.length + 1)
  const clone = document.getElementById("timing-1").cloneNode(true)
  clone.id = newId
  const swiperWrapper = document.querySelector(".swiper-wrapper")
  swiperWrapper.appendChild(clone)
  const newInputs = Array.from(document.querySelectorAll(`#${newId} input`))
  for(const input of newInputs){
    input.addEventListener("input",changeStatus)
    input.parentElement.parentElement.parentElement.classList.remove("item-input-with-value")
    input.value = ""
  }
  swiper.appendSlide(clone)
  swiper.slideNext()
  changeStatus()
}
function init(){
  const inputs = Array.from(document.querySelectorAll(`#timing-1 input`))
  for(const input of inputs){
    input.addEventListener("input",changeStatus)
  }
  document.getElementById("add-subject").addEventListener("click",()=>{
    const data = getData()
    data.channel = channel
    console.log(data)
    conn.emit("addSubject",data,(err)=>{
      if(err) throw new Error(err)
      mainView.router.back()
    })
  })
  changeStatus()
}
init()