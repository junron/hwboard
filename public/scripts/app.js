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
    {
      name:"timetable",
      path:"/timetable",
      url:"/routes/timetable.html",
      reloadPrevious:true,
      animate:false,
      on:{
        pageAfterIn:e=>{
          const target = e.currentTarget
          const tag = document.createElement("script")
          tag.src = "/routes/scripts/timetable.js"
          target.appendChild(tag)
          const linkTag = document.createElement("link")
          linkTag.rel = "stylesheet"
          linkTag.href = "/routes/styles/timetable.css"
          target.appendChild(linkTag)
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
            const target = e.currentTarget;
            const tag = document.createElement("script");
            tag.src = "/scripts/loadHomework.js";
          target.appendChild(tag)
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
          pageAfterIn:function(e,page){
              gradedCheckboxChecked = false;
              $(".page-current #edit-title").text("Add homework");
            initEditHomeworkEvents()
          }
        }
      },
      {
        name:"edit-homework",
        path: "/popups/edit/",
        url:"/routes/edit-homework.html",
        on :{
          pageAfterIn:function(e,page){
              console.log({e, page});
            if(e.detail.route.url.includes("?edit=true")){
              Framework7App.router.navigate("/popups/edit/")
            }
              $(".page-current #edit-title").text("Edit homework");
              startEdit();
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
      name:"channelStats",
      path:"/channels/:channelName/analytics",
      reloadPrevious:true,
      animate:false,
      url:"/{{channelName}}/analytics",
      on:{
        pageAfterIn:e=>{
            channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0];
            homeworkDateChart = false;
            homeworkSubjectChart = false;
          conn.emit("isReady",null,res=>{
              console.log("ready before page load");
            renderCharts()
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
            const scriptTag = document.createElement("script");
            scriptTag.src = "/routes/scripts/add-channel.js";
            const target = e.currentTarget;
          target.appendChild(scriptTag)
        }
      }
    },
      {
          name: "calendar",
          path: "/calendar",
          reloadPrevious: true,
          animate: false,
          url: "/calendar",
          on: {
              pageAfterIn: e => {
                  const sources = ['/moment/min/moment.min.js', '/fullcalendar/dist/fullcalendar.js', '/scripts/calendar.js', '/styles/calendar.css', '/fullcalendar/dist/fullcalendar.css'];
                  //const scriptTag = document.createElement("script")
                  const target = e.currentTarget;
                  loadSources(target, sources);
                  //scriptTag.src = "/routes/scripts/add-channel.js"
                  //const target = e.currentTarget
                  //target.appendChild(scriptTag)
              }
          }
      },
    {
      name:"channelSettings",
      path:"/channels/:channelName/settings",
      reloadPrevious:true,
      animate:false,
      url:"/{{channelName}}/settings",
      on:{
        pageAfterIn:e=>{
            channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0];
          conn.emit("isReady",null,res=>{
            getChannelData()
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
                console.log(e);
                const scriptTag = document.createElement("script");
                scriptTag.src = "/routes/scripts/add-member.js";
                const target = e.currentTarget;
              target.appendChild(scriptTag)
            }
          }
        },
        {
          name:"add-subject",
          path: "/popups/add-subject/",
          url:"/routes/add-subject.html",
          on:{
            pageAfterIn:e=>{
                console.log(e);
                const scriptTag = document.createElement("script");
                scriptTag.src = "/routes/scripts/add-subject.js";
                const target = e.currentTarget;
              target.appendChild(scriptTag)
            }
          }

        }
      ]
    },
  ],
  dialog:{
    title: 'Hwboard',
  }
});

function loadSources(target, sources) {
    for (const src of sources) {
        if (src.endsWith(".js")) {
            const scriptTag = document.createElement("script");
            scriptTag.src = src;
            target.appendChild(scriptTag);
        } else if (src.endsWith(".css")) {
            const styleTag = document.createElement("link");
            styleTag.rel = "stylesheet";
            styleTag.href = src;
            target.appendChild(styleTag);
        }
    }
}