//WebKit bug where variable declared with const or let
//Cant have the same name as an id
const theme = "md";
const Framework7App = new Framework7({
  // App root element
  root: '#app',
  theme,
  pushState:true,
  view: {
    pushState: true,
  },
  routes:[
    // {
    //   name:"timetable",
    //   path:"/timetable",
    //   url:"/routes/timetable.html",
    //   reloadPrevious:true,
    //   animate:false,
    //   on:{
    //     pageAfterIn:e=>{
    //       loadSources(e.currentTarget,["/routes/scripts/timetable.js","/routes/styles/timetable.css"])
    //     }
    //   }
    // },
    {
      name:"channels",
      path:"/channels",
      url:"/channels",
      reloadPrevious:true,
      animate:false,
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
        }
      }
    },
    {
      name:"home",
      path:"/",
      reloadPrevious:true,
      animate:false,
      url:"/",
      on:{
        pageAfterIn:e=>{
          prevDataHash = ""
          loadSources(e.currentTarget,["/scripts/loadHomework.js"])
        }
      },
      routes:[{
        name:"sort",
        path: "/popups/sort/",
        url:"/routes/sort.html",
        on :{
          pageInit: _=>{
            //Uncheck all
              const radios = Array.from(document.querySelectorAll(`input[type=radio]`));
              radios.forEach(radio => radio.checked = false);
              const sortType = sortOptions.type || getCookie("sortType") || "Due date";
              let sortOrder = sortOptions.order || 0;
              document.querySelector(`input[type=radio][name=type][value='${sortType}']`).checked = true;
            document.querySelector(`input[type=radio][name=order][value='${sortOrder}']`).checked = true
          }
        }
      },
      {
        name:"add-homework",
        path: "/popups/add/",
        url:"/routes/edit-homework.html",
        on :{
          pageBeforeIn:function(e,page){
            $(page.el.querySelector("#edit-title")).text("Add homework")
          },
          pageAfterIn:function(e,page){
            gradedCheckboxChecked = false
            initEditHomeworkEvents()
          }
        }
      },
      {
        name:"edit-homework",
        path: "/popups/edit/",
        url:"/routes/edit-homework.html",
        on :{
          pageBeforeIn:function(e,page){
            $(page.el.querySelector("#edit-title")).text("Edit homework")
            startEdit()
          },
          pageAfterIn:function(e,page){
              console.log({e, page});
            if(e.detail.route.url.includes("?edit=true")){
              Framework7App.router.navigate("/popups/edit/")
            }
            $(".page-current #edit-title").text("Edit homework")
            initEditHomeworkEvents()
          }
        }
      }
    ]
    },
    //Currently disabled 
    // As it adds extra complexity

    // {
    //   name:"channels",
    //   path:"/channels/:channelName",
    //   reloadPrevious:true,
    //   animate:false,
    //   url:"/{{channelName}}",
    // },
    {
      name:"overallStats",
      path:"/analytics",
      reloadPrevious:true,
      animate:false,
      url:"/routes/channel-analytics.html",
      on:{
        pageAfterIn:e=>{
          channel = ""
          if(typeof conn==="undefined" || conn.connected===false){
            renderCharts()
          //   //SHow offline message
          //   const homeworkSubject = $("#homework-subject-chart")[0].getContext("2d")
          //   homeworkSubject.font = "15px Helvetica"
          //   homeworkSubject.textAlign = "center"
          //   homeworkSubject.fillText("Can't load data offline",$("#homework-subject-chart")[0].width/2,$("#homework-subject-chart")[0].height/2)
            
          //   const homeworkDate = $("#homework-date-chart")[0].getContext("2d")
          //   homeworkDate.font = "15px Helvetica"
          //   homeworkDate.textAlign = "center"
          //   homeworkDate.fillText("Can't load data offline",$("#homework-date-chart")[0].width/2,$("#homework-date-chart")[0].height/2)
          }
          homeworkDateChart = false
          homeworkSubjectChart = false
          
          $("a[href='/channels'").parent().html(`<a href="#" class="left panel-open" style="padding-left:10px"><i class="bar" style="color:#ffffff">&#xe900;</i></a>`)
          $("a[href='/channelName/data.json'").attr("download",`data.json`)
          $("a[href='/channelName/data.json'").attr("href",`/data.json`)
          $("a[href='/channelName/data.csv'").attr("download",`data.csv`)
          $("a[href='/channelName/data.csv'").attr("href",`/data.csv`)
          conn.emit("isReady",null,res=>{
            if(res){
              console.log("ready before page load")
              renderCharts()
            }
          })
          //Db inited, can get data
          conn.on("ready",()=>{
            if(location.hash.endsWith("/analytics")){
              console.log("ready")
              renderCharts()
            }
          })
        }
      }
    },
    {
      name:"channelStats",
      path:"/channels/:channelName/analytics",
      reloadPrevious:true,
      animate:false,
      url:"/routes/channel-analytics.html",
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
          if(typeof conn==="undefined" || conn.connected===false){
            renderCharts()
          //   //SHow offline message
          //   const homeworkSubject = $("#homework-subject-chart")[0].getContext("2d")
          //   homeworkSubject.font = "15px Helvetica"
          //   homeworkSubject.textAlign = "center"
          //   homeworkSubject.fillText("Can't load data offline",$("#homework-subject-chart")[0].width/2,$("#homework-subject-chart")[0].height/2)
            
          //   const homeworkDate = $("#homework-date-chart")[0].getContext("2d")
          //   homeworkDate.font = "15px Helvetica"
          //   homeworkDate.textAlign = "center"
          //   homeworkDate.fillText("Can't load data offline",$("#homework-date-chart")[0].width/2,$("#homework-date-chart")[0].height/2)
          }
          homeworkDateChart = false
          homeworkSubjectChart = false
          $("a[href='/channelName/data.json'").attr("download",`${channel}.data.json`)
          $("a[href='/channelName/data.json'").attr("href",`/${channel}/data.json`)
          $("a[href='/channelName/data.csv'").attr("download",`${channel}.data.csv`)
          $("a[href='/channelName/data.csv'").attr("href",`/${channel}/data.csv`)
          conn.emit("isReady",null,res=>{
            if(res){
              console.log("ready before page load")
              renderCharts()
            }
          })
        }
      }
    },
    {
      name:"addChannel",
      path:"/addChannel",
      reloadPrevious:true,
      animate:false,
      url:"/routes/add-channel.html",
      on:{
        pageAfterIn:e=>{
          loadSources(e.currentTarget,["/routes/scripts/add-channel.js"])
        }
      }
    },
      {
          name: "calendar",
          path: "/calendar/",
          reloadPrevious: true,
          animate: false,
          url: "/calendar",
          on: {
              pageAfterIn: async e => {
                  const sources = ['/moment/min/moment.min.js', '/fullcalendar/dist/fullcalendar.js', '/scripts/calendar.js', '/styles/calendar.css', '/fullcalendar/dist/fullcalendar.css'];
                  const target = e.currentTarget;
                  await loadSources(target, sources)
                  while (!$("#calendar").fullCalendar){}
                  calendarInit()
              }
          }
      },
    {
      name:"channelSettings",
      path:"/channels/:channelName/settings",
      reloadPrevious:true,
      animate:false,
      url:"/routes/channel-settings.html",
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
          if(!navigator.onLine){
            $("#subject-list li").text("Can't load data offline")
            $("#member-list li").text("Can't load data offline")
            return getChannelData()
          }
          $(".root-only").hide()
          conn.emit("isReady",null,res=>{
            if(res){
              getChannelData()
            }
          })
        }
      },
      routes:[
        {
          name:"add-member",
          path: "/popups/add-member/",
          url:"/routes/add-member.html",
          on:{
            pageAfterIn:e=>{
              loadSources(e.currentTarget,["/routes/scripts/add-member.js"])
            }
          }
        },
        {
          name:"add-subject",
          path: "/popups/add-subject/",
          url:"/routes/add-subject.html",
          on:{
            pageAfterIn:e=>{
              const target = e.currentTarget
              // const scriptTag2 = document.createElement("script")
              // scriptTag2.src = "/routes/scripts/add-subject-timetable.js"
              // target.appendChild(scriptTag2)
              loadSources(target,["/routes/scripts/add-subject.js"])//,"/routes/styles/timetable.css"])
              // scriptTag2.onload = ()=>{
              //   addSubjectRenderTimetable().then(_=>{
              //     $("#app .page-current table#homeworkboard-timetable td").filter(function(){
              //       return this.innerHTML === " "
              //     }).css("background-color","#d8ffe0")
              //   })
              // }
            }
          }

        }
      ]
    },
  ],
  dialog:{
    title: 'Hwboard',
  }
})

async function loadSources(target, sources) {
  function loadSource(source){
    return new Promise((resolve,reject)=>{
      if (source.endsWith(".js")) {
        const scriptTag = document.createElement("script");
        scriptTag.src = source;
        scriptTag.addEventListener("load",resolve);
        target.appendChild(scriptTag);
      } else if (source.endsWith(".css")) {
        const styleTag = document.createElement("link");
        styleTag.rel = "stylesheet";
        styleTag.href = source;
        target.appendChild(styleTag);
        styleTag.addEventListener("load",resolve);
      }else{
        reject("Source type cannot be determined")
      }
    })
  }
  return Promise.all(sources.map(loadSource))
}
