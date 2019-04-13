//WebKit bug where variable declared with const or let
//Cant have the same name as an id
const theme = "md";
const Framework7App = new Framework7({
  // App root element
  root: '#app',
  theme,
  pushState:true,
  name:"Hwboard",
  id:"web.hwboard.hwboard2",
  lazyModulesPath: '/framework7/components',
  view: {
    pushState: true,
    mdSwipeBack:true
  },
  routes:[
    {
      name:"logout",
      path:"/logout",
      url:"/logout",
    },
    {
      name:"timetable",
      path:"/timetable",
      url:"/routes/timetable.html",
      animate:false,
      on:{
        pageAfterIn:e=>{
          loadSources(e.currentTarget,["/routes/scripts/timetable.js","/routes/styles/timetable.css",'/fullcalendar/dist/fullcalendar.min.css'])
            .then(()=>{
              while (!$("#hwboard-timetable").fullCalendar){
                continue;
              }
              renderTimetable();
            });
        }
      }
    },
    {
      name:"channels",
      path:"/channels",
      url:"/channels",
      reloadPrevious:true,
      animate:false,
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0];
        }
      },
    },
    {
      name:"home",
      path:"/",
      reloadPrevious:true,
      animate:false,
      url:"/",
      on:{
        pageBeforeIn:()=>{
          if(document.querySelector(".page-next .navbar.fouc")){
            document.querySelector(".page-next .navbar.fouc").classList.remove("fouc");
          }
          document.querySelector("#hwboard-homework-list").style.position = "relative";
          document.querySelector("#hwboard-homework-list").style.top = "60px";
        },
        pageAfterIn:e=>{
          prevDataHash = "";
          if(Framework7App.ptr){
            ptr = Framework7App.ptr.get('.page-current .ptr-content');
            ptr.on("refresh",async (_,done)=>{
              $("#hwboard-homework-list").html("<h2 class=homework-reload-status>Reloading homework...</h2>");
              setTimeout(async ()=>{
                await loadHomework(true);
                done();
              },300);
            });
          }
          console.log("Navbar");
          loadSources(e.currentTarget,["/scripts/loadHomework.js"]);
          if(location.search.includes("websocketOffline=true")){
            $("#connection-status").text("Simulated offline");
          }
        }
      },
      routes:[
        {
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
              document.querySelector(`input[type=radio][name=order][value='${sortOrder}']`).checked = true;
            }
          },
          modules:['checkbox','input','grid',"radio"]
        },
        {
          name:"add-homework",
          path: "/popups/add/",
          url:"/routes/edit-homework.html",
          on :{
            pageBeforeIn:function(e,page){
              $(page.el.querySelector("#edit-title")).text("Add homework");
            },
            pageAfterIn:function(e,page){
              gradedCheckboxChecked = false;
              initEditHomeworkEvents();
            }
          },
          modules:['grid','input','dialog','smart-select','popup']
        },
        {
          name:"edit-homework",
          path: "/popups/edit/",
          url:"/routes/edit-homework.html",
          on :{
            pageBeforeIn:(_,page)=>{
              $(page.el.querySelector("#edit-title")).text("Edit homework");
            },
            pageAfterIn:e=>{
              initEditHomeworkEvents();
            }
          },
          modules:['grid','input','dialog','smart-select','popup']
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
          channel = "";
          if(typeof conn==="undefined" || conn.connected===false){
            renderCharts();
          }
          homeworkDateChart = false;
          homeworkSubjectChart = false;
          $("a[href='/channels']").parent().html(`<a href="#" class="left panel-open" style="padding-left:10px"><i class="bar" style="color:#ffffff">&#xe900;</i></a>`);
          $("a[href='/channelName/data.json']").attr("download",`data.json`);
          $("a[href='/channelName/data.json']").attr("href",`/data.json`);
          $("a[href='/channelName/data.csv']").attr("download",`data.csv`);
          $("a[href='/channelName/data.csv']").attr("href",`/data.csv`);
          conn.emit("isReady",null,res=>{
            if(res){
              console.log("ready before page load");
              const i = setInterval(()=>{
                //Allow canvas to render and exist
                if(document.getElementById("homework-subject-chart")){
                  renderCharts();
                  clearInterval(i);
                }
              },500);
            }
          });
          //Db inited, can get data
          conn.on("ready",()=>{
            console.log("ready");
            const i = setInterval(()=>{
              //Allow canvas to render and exist
              if(document.getElementById("homework-subject-chart")){
                renderCharts();
                clearInterval(i);
              }
            },500);
            renderCharts();
          });
        }
      },
      modules:['checkbox','grid']
    },
    {
      name:"channelStats",
      path:"/channels/:channelName/analytics",
      reloadPrevious:true,
      animate:false,
      url:"/routes/channel-analytics.html",
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0];
          if(typeof conn==="undefined" || conn.connected===false){
            renderCharts();
          }
          homeworkDateChart = false;
          homeworkSubjectChart = false;
          $("a[href='/channelName/data.json']").attr("download",`${channel}.data.json`);
          $("a[href='/channelName/data.json']").attr("href",`/${channel}/data.json`);
          $("a[href='/channelName/data.csv']").attr("download",`${channel}.data.csv`);
          $("a[href='/channelName/data.csv']").attr("href",`/${channel}/data.csv`);
          conn.emit("isReady",null,res=>{
            if(res){
              console.log("ready before page load");
              renderCharts();
            }
          });
        }
      },
      modules:['checkbox','grid']
    },
    {
      name:"addChannel",
      path:"/addChannel",
      reloadPrevious:true,
      animate:false,
      url:"/routes/add-channel.html",
      on:{
        pageAfterIn:e=>{
          loadSources(e.currentTarget,["/routes/scripts/add-channel.js"]);
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
          const sources = ['/scripts/calendar.js', '/styles/calendar.css', '/fullcalendar/dist/fullcalendar.min.css'];
          const target = e.currentTarget;
          await loadSources(target, sources);
          while (!$("#calendar").fullCalendar){
            continue;
          }
          calendarInit();
        }
      },
      modules:['grid']
    },
    {
      name:"channelSettings",
      path:"/channels/:channelName/settings",
      reloadPrevious:true,
      animate:false,
      url:"/routes/channel-settings.html",
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0];
          if(!navigator.onLine){
            $("#subject-list li").text("Can't load data offline");
            $("#member-list li").text("Can't load data offline");
            return getChannelData();
          }
          $(".root-only").hide();
          conn.emit("isReady",null,res=>{
            if(res){
              getChannelData();
            }
          });
        }
      },
      routes:[
        {
          name:"add-member",
          path: "/popups/add-member/",
          url:"/routes/add-member.html",
          on:{
            pageAfterIn:e=>{
              loadSources(e.currentTarget,["/routes/scripts/add-member.js"]);
            }
          },
          modules:['grid','input','dialog','autocomplete']
        },
        {
          name:"add-tag",
          path: "/popups/add-tag/",
          url:"/routes/add-tag.html",
          on:{
            pageAfterIn:e=>{
              loadSources(e.currentTarget,["/routes/scripts/add-tag.js"]);
            }
          },
          modules:['grid','input','dialog','autocomplete']
        },
        {
          name:"add-subject",
          path: "/popups/add-subject/",
          url:"/routes/add-subject.html",
          on:{
            pageAfterIn:e=>{
              const target = e.currentTarget;
              loadSources(target,["/routes/scripts/timetable.js","/routes/styles/timetable.css",'/fullcalendar/dist/fullcalendar.min.css']).then(()=>{
                renderTimetable("#hwboard-add-subject-timetable",true);
                updateDisabledStatus();
              });
            }
          },
          modules:['grid','input','dialog']
        }
      ],
      modules:['accordion']
    },
  ],
  dialog:{
    title: 'Hwboard',
  }
});

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
        reject("Source type cannot be determined");
      }
    });
  }
  return Promise.all(sources.map(loadSource));
}
Framework7App.swipeout.init();
Framework7App.input.init();