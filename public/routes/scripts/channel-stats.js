let homeworkSubjectChart
let homeworkDateChart
let gradedMode = 0

channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]

//Db inited, can get data
conn.on("ready",()=>{
  console.log("ready")
  conn.emit("homeworkSubjectData",{channel},(err,data)=>{
    if(err) throw err
    homeworkSubjectChart = renderHomeworkSubjectChart(data)
  })
  conn.emit("homeworkDayData",{channel},(err,data)=>{
    if(err) throw err
    homeworkDateChart = renderHomeworkDateChart(filterOutWeekends(fillInDays(data)))
  })
})

const test = document.querySelector("input[type=checkbox][value=tests]")
const regular = document.querySelector("input[type=checkbox][value=regular]")
regular
.addEventListener("change",e=>{
  const checked = e.target.checked
  if(checked){
    if(test.checked){
      gradedMode =0
    }else{
      gradedMode = -1
    }
  }else{
    if(test.checked){
      gradedMode = 1
    }else{
      gradedMode = 0
    }
  }
  conn.emit("homeworkSubjectData",{channel,graded:gradedMode},(err,data)=>{
    if(err) throw err
    homeworkSubjectChart = renderHomeworkSubjectChart(data)
  })
})
test
.addEventListener("change",e=>{
  const checked = e.target.checked
  if(checked){
    if(regular.checked){
      gradedMode = 0
    }else{
      gradedMode = 1
    }
  }else{
    if(regular.checked){
      gradedMode = -1
    }else{
      gradedMode = 0
    }
  }
  conn.emit("homeworkSubjectData",{channel,graded:gradedMode},(err,data)=>{
    if(err) throw err
    homeworkSubjectChart = renderHomeworkSubjectChart(data)
  })
})

const getKeysAndValues = array =>{
  const result = [[],[]]
  for(const elem of array){
    result[0].push(elem[0])
    result[1].push(elem[1])
  }
  return result
}
const sumArr = arr =>{
  let sum = 0
  for(const val of arr){
    sum += val
  }
  return sum
}

const filterOutWeekends = data =>{
  for(let day in data){
    if(!notWeekend(parseInt(day))){
      delete data[day]
    }
  }
  return data
}
const fillInDays = homeworkData =>{
  let thisDay 
  for(let day in homeworkData){
    day = parseInt(day)
    if(!thisDay){
      thisDay = day
    }else{
      if(thisDay<(day-1)){
        //There are days with 0 homework
        for(let i = thisDay+1;i<day;i++){
          homeworkData[i] = 0
        }
      }
      thisDay = day
    }
  }
  return homeworkData
}
const default_colors = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC']
const getColors = array => default_colors.slice(0,array.length)
function renderHomeworkSubjectChart(data){
  const split = getKeysAndValues(data)
  const keys = split[0]
  const values = split[1]
  if(homeworkSubjectChart){
    homeworkSubjectChart.data = {
      labels:keys,
      datasets:[{
        data:values,
        backgroundColor:getColors(keys)
      }]
    }
    homeworkSubjectChart.update()
    return homeworkSubjectChart
  }
  const canvas = document.getElementById("homework-subject-chart")
  const chart = new Chart(canvas,{
    type:"pie",
    data:{
      labels:keys,
      datasets:[{
        data:values,
        backgroundColor:getColors(keys)
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio: false,
      legend:{
        position:"right",
        labels:{
          boxWidth:20,
          filter: (legend,chart)=>{
            if(legend.text.endsWith("(0%)")){
              return false
            }
            return true
          },
          generateLabels:chart=>{
            const {data} = chart
            const values = data.datasets[0].data
            const total = sumArr(values)
            const colors = data.datasets[0].backgroundColor
            const labels = data.labels
            const res = []
            for(const label of labels){
              const labelObj = {}
              const num = res.length
              const value = values[num]
              const percentage = Math.floor((value/total)*100)
              labelObj.text = label + ` (${percentage}%)`
              labelObj.fillStyle = colors[num]
              res.push(labelObj)
            }
            return res
          }
        }
      }
    }
  })
  return chart
}

const toDate = int => new Date(int*24*60*60*1000).toString().slice(4,10)
const notWeekend = int => !(new Date(int*24*60*60*1000).getDay() == 6 || new Date(int*24*60*60*1000).getDay() == 0)

function renderHomeworkDateChart(data){
  if(homeworkDateChart){
    homeworkDateChart.data = {
      labels:Object.keys(data),
      datasets:[{
        data:Object.values(data),
        backgroundColor:getColors(Object.keys(data)),
        backgroundColor:"rgb(138,43,226,0.2)",
        borderColor:"rgb(138,43,226)",
        pointRadius:0,
        pointStyle:"cross",
        lineTension:0,
      }]
    }
    homeworkDateChart.update()
    return homeworkDateChart
  }
  const canvas = document.getElementById("homework-date-chart")
  const chart = new Chart(canvas,{
    type:"line",
    data:{
      labels:Object.keys(data).map(toDate),
      datasets:[{
        lineTension:0,
        data:Object.values(data),
        backgroundColor:"rgb(138,43,226,0.2)",
        borderColor:"rgb(138,43,226)",
        pointRadius:0,
        pointStyle:"cross"
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          display: true,
          ticks: {
              suggestedMax: 10,    
              beginAtZero: true
          }
        }]
      },
      legend:{
        display:false
      }
    }
  })
  return chart
}