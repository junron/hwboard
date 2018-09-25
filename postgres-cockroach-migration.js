function array(input){
  input = input.split(",")
  if(input.length===0){
    return "ARRAY[]"
  }
  input = input.map(elem => `'${elem}'`)
  input = input.join(',')
  input = input.replace("'{","ARRAY['")
  input = input.replace("}'","']")
  return input
}
function string(input){
  return `'${input}'`
}
function bool(input){
  return input === "t"
}
function channel(data){
  data = data.split("\t")
  data[0] = "'"+uuid()+"'"
  data[1] = string(data[1])
  data[2] = array(data[2].split('"').join(""))
  data[3] = string(data[3])
  data[4] = array(data[4])
  data[5] = array(data[5])
  data[6] = array(data[6])
  data[7] = array(data[7])
  return `INSERT INTO channels values(${data.join(",")});`
}
function homework(data){
  data = data.split("\t")
  data[0] = "'"+uuid()+"'"
  data[1] = string(data[1])
  data[2] = string(data[2])
  data[3] = string(data[3])
  data[4] = bool(data[4])
  data[5] = string(data[5])
  data[6] = string(data[6])
  return `INSERT INTO "homework-${channelName}" values(${data.join(",")});`
}
function channels(data){
  data = data.split("\n")
  return data.map(channel).join("")
}
function homeworks(data){
  data = data.split("\n")
  return data.map(homework).join("")
}
function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}