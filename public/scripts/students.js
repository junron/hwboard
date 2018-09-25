'use strict'
const commonJS = ("undefined" != typeof require)
const node = ("undefined" == typeof window)
const studentsByName = {}
const studentsByMG = {}
const studentsById = {}
let students
async function loadJSONData(dataPath,cache=false){
  if(students){
    //Already fetched data
    return students
  }
  let data
  if(node && commonJS){
    data = require(dataPath)
  }else{
    data = await fetch(dataPath)
    .then(function(res){
      return res.json()
    })
  }
  students = data
  if(Object.keys(studentsByMG).length){
    console.log(studentsByMG)
    return
  }
  for (const student of data){
    if(typeof studentsByMG[student.mentorGrp]=="undefined"){
      studentsByMG[student.mentorGrp] = [student.id]
    }else{
      studentsByMG[student.mentorGrp].push(student.id)
    }
    studentsByName[student.name] = student.id
    studentsById[student.id] = student
  }
  return data
}
async function getStudentById(studentId){
  const result = studentsById[studentId]
  if(!result) throw new Error("Student not found")
  return result
}
function getStudentByIdSync(studentId){
  return studentsById[studentId]
}
function getClassesSync(){
  return Object.keys(studentsByMG)
}
async function getStudentByName(studentName){
  const result = studentsById[studentsByName[studentName]]
  if(!result) throw new Error("Student not found")
  return result
}
async function getStudentsByLevel(year){
  const yearNow = new Date().getFullYear()%100
  const resultPromises = []
  for(let i=1;i<=7;i++){
    resultPromises.push(getStudentsByClassName(`M${yearNow}${year}0${i}`))
  }
  const result = await Promise.all(resultPromises)
  return [].concat(...result)
}
async function getStudentsByClassName(mentorGrp){
  const result = studentsByMG[mentorGrp]
  if(!result) throw new Error("Student not found")
  return result
}
function getStudentsByClassNameSync(mentorGrp){
  return studentsByMG[mentorGrp]
}
async function getStudentByName2(studentName){
  return students.find(student => student.name == studentName)
}


const studentsExport = Object.freeze({
  loadJSONData,
  getStudentById,
  getStudentByName,
  getStudentsByClassName,
  getStudentsByClassNameSync,
  getStudentByName2,
  getStudentByIdSync,
  getClassesSync,
  getStudentsByLevel
})
if(typeof getData != "undefined"){
  studentsExport.getData = getData
}
//commonJS pro
if(commonJS){
  module.exports = Object.freeze({
    loadJSONData,
    getStudentById,
    getStudentByName,
    getStudentsByClassName,
    getStudentByName2,
    getStudentsByLevel,
  })
}