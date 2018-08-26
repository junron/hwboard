const studentsByName = {}
const studentsByMG = {}
const studentsById = {}
const students = require("./data.json")
for (const student of students){
  if(typeof studentsByMG[student.mentorGrp]=="undefined"){
    studentsByMG[student.mentorGrp] = [student.id]
  }else{
    studentsByMG[student.mentorGrp].push(student.id)
  }
  studentsByName[student.name] = student.id
  studentsById[student.id] = student
}
async function getStudentById(studentId){
  const result = studentsById[studentId]
  if(!result) throw new Error("Student not found")
  return result
}
async function getClasses(){
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
async function getStudentsRawData(){
  return students
}
module.exports = Object.freeze({
  getStudentById,
  getStudentByName,
  getStudentsByClassName,
  getStudentsByLevel,
  getClasses,
  getStudentsRawData
})