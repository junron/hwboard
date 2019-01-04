const Fuse = require("fuse.js");
const studentsByName = {};
const studentsByMG = {};
const studentsById = {};
const students = require("./data.json");
const studentsSearch = new Fuse(students,{
  shouldSort: true,
  threshold: 0.4,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 3,
  keys: [
    "id",
    "name"
  ]
});
for (const student of students){
  if(typeof studentsByMG[student.mentorGrp]=="undefined"){
    studentsByMG[student.mentorGrp] = [student.id];
  }else{
    studentsByMG[student.mentorGrp].push(student.id);
  }
  studentsByName[student.name] = student.id;
  studentsById[student.id] = student;
}
async function getStudentById(studentId){
  const result = studentsById[studentId];
  if(!result) throw new Error("Student not found");
  return result;
}
async function getClasses(){
  return Object.keys(studentsByMG);
}
async function getStudentByName(studentName){
  const result = studentsById[studentsByName[studentName]];
  if(!result) throw new Error("Student not found");
  return result;
}
async function getStudentsByLevel(year){
  const yearNow = new Date().getFullYear()%100;
  const resultPromises = [];
  for(let i=1;i<=7;i++){
    resultPromises.push(getStudentsByClassName(`M${yearNow}${year}0${i}`));
  }
  const result = await Promise.all(resultPromises);
  return [].concat(...result);
}
async function getStudentsByClassName(mentorGrp){
  const result = studentsByMG[mentorGrp];
  if(!result) throw new Error("Student not found");
  return result;
}
const MGSearch = new Fuse(Object.keys(studentsByMG),{
  shouldSort: true,
  threshold: 0.4,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 3
});
async function searchStudents(query){
  query = query.trim();
  if(query.length==0){
    return {
      type:"empty",
      data:[]
    };
  }
  const MGPrefix = Object.keys(studentsByMG)[0].substring(0,3);
  if(query.toUpperCase().substring(0,3)==MGPrefix){
    const mgs = MGSearch.search(query).slice(0,3).map(num => Object.keys(studentsByMG)[num]);
    const result = [];
    for(const mg of mgs){
      result.push({
        name:mg,
        info:`${studentsByMG[mg].length} students`
      });
    }
    return {
      type:"mentorGroup",
      data:result
    };
  }
  return {
    type:"student",
    data:studentsSearch.search(query).slice(0,3)
  };
}
module.exports = Object.freeze({
  getStudentById,
  getStudentByName,
  getStudentsByClassName,
  getStudentsByLevel,
  getClasses,
  searchStudents
});