const {expect} = require("chai");

const timetable = {"Chinese":{"tue":[[1030,1130]],"wed":[[1100,1200]],"thu":[[1200,1300]]},"CS problem solving":{"thu":[[1500,1800]]},"Physics":{"mon":[[800,930]],"wed":[[800,930]]},"English":{"mon":[[1100,1200]],"wed":[[1200,1300]],"thu":[[1400,1500]]},"Math":{"mon":[[1000,1100]],"tue":[[1300,1400]],"wed":[[930,1030]],"thu":[[1100,1200]]},"Humanities":{"tue":[[800,900]]},"PE":{"tue":[[900,1000]],"thu":[[800,900]]},"Chemistry":{"tue":[[1130,1300]],"fri":[[1030,1200]]},"Biology":{"thu":[[930,1100]],"fri":[[830,1000]]},"Geography":{"fri":[[1300,1500]]},"CCE":{"wed":[[1300,1400]]}};
const {parseDate,setSubject} = require("../public/scripts/dates")(timetable);
describe("Hwboard date parser",function(){
  before(async()=>{
    return setSubject("Chinese");
  });
  async function getDate(datePromise){
    let date;
    try{
      date = await datePromise;
    }catch(e){
      return "Invalid Date";
    }
    if(date instanceof Date){
      return date.toDateString();
    }
    return "Invalid Date";
  }
  it("Should be able to parse simple dates",async ()=>{
    const today = new Date();
    const tomorrow = new Date();
    const wednesday = new Date();
    const nextMonth = require("sugar-date").Date.create("next month");
    tomorrow.setDate(today.getDate()+1);
    wednesday.setDate(wednesday.getDate() + (3 + 7 - wednesday.getDay()) % 7);
    const dates = ["tomorrow","wed","next month","wedneday","1970"];
    const expectedResults = [tomorrow.toDateString(),wednesday.toDateString(),nextMonth.toDateString(),"Invalid Date","Invalid Date"];
    const actualResult = await Promise.all(dates.map(parseDate).map(getDate));
    expect(actualResult).to.eql(expectedResults);
  });
});
