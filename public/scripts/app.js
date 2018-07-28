//WebKit bug where variable declared with const or let
//Cant have the same name as an id
const theme = "md"
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
      name:"channels",
      path:"/channels",
      url:"/channels",
      reloadPrevious:true,
      animate:false,
      on:{
        pageAfterIn:e=>{
          if(typeof channelScriptLoaded != "undefined"){
            return
          }
          const scriptTag = document.createElement("script")
          scriptTag.src = "/routes/scripts/channels.js"
          const target = e.currentTarget
          target.appendChild(scriptTag)
        }
      }
    },
    {
      name:"home",
      path:"/",
      reloadPrevious:true,
      animate:false,
      url:"/",
      routes:[{
        name:"sort",
        path: "/popups/sort/",
        url:"/routes/sort.html",
        on :{
          pageInit: _=>{
            //Uncheck all
            const radios = Array.from(document.querySelectorAll(`input[type=radio]`))
            radios.forEach(radio => radio.checked=false)
            const sortType = sortOptions.type || getCookie("sortType") || "Due date"
            let sortOrder = sortOptions.order || 0
            document.querySelector(`input[type=radio][name=type][value='${sortType}']`).checked = true
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
            gradedCheckboxChecked = false
            $(".page-current #edit-title").text("Add homework")
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
            console.log({e,page})
            if(e.detail.route.url.includes("?edit=true")){
              Framework7App.router.navigate("/popups/edit/")
            }
            $(".page-current #edit-title").text("Edit homework")
            startEdit()
            initEditHomeworkEvents()
          }
        }
      }
    ]
    },
    {
      name:"channels",
      path:"/channels/:channelName",
      reloadPrevious:true,
      animate:false,
      url:"/{{channelName}}"
    },
    {
      name:"channelStats",
      path:"/channels/:channelName/analytics",
      reloadPrevious:true,
      animate:false,
      url:"/{{channelName}}/analytics",
      on:{
        pageAfterIn:e=>{
          channel = (location.hash.split("#!/channels/")[1] || "").split("/")[0]
          const target = e.currentTarget
          const resources = ["/scripts/Chart.bundle.min.js","/routes/scripts/channel-stats.js","/routes/styles/channel-stats.css"]
          for(const resource of resources){
            let tag
            if(resource.endsWith(".js")){
              //Chart script is already loaded
              if(resource=="/routes/scripts/channel-stats.js" && typeof gradedMode != "undefined"){
                //Force charts to rerender
                homeworkDateChart = false
                homeworkSubjectChart = false
                renderChartsIfReady()
                continue
              }
              tag = document.createElement("script")
              tag.src = resource
            }else if(resource.endsWith(".css")){
              tag = document.createElement("link")
              tag.rel = "stylesheet"
              tag.href = resource
            }
            target.appendChild(tag)
          }
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
          const target = e.currentTarget
          const scripts = ["/scripts/students.js","/routes/scripts/render-admins.js","/routes/scripts/render-subjects.js","/routes/scripts/channel-settings.js"]
          for(const script of scripts){
            if(script=="/routes/scripts/render-admins.js"&&typeof renderAdmins != "undefined"){
              continue
            }
            if(script=="/routes/scripts/render-subjects.js"&&typeof renderSubjects != "undefined"){
              continue
            }
            if(script=="/scripts/students.js"&&typeof commonJS != "undefined"){
              continue
            }
            const scriptTag = document.createElement("script")
            scriptTag.src = script
            target.appendChild(scriptTag)
          }
          const styleTag = document.createElement("link")
          styleTag.rel = "stylesheet"
          styleTag.href = "/routes/styles/channel-settings.css"
          target.appendChild(styleTag)
        }
      },
      routes:[
        {
          name:"add-member",
          path: "/popups/add-member/",
          url:"/routes/add-member.html",
          on:{
            pageAfterIn:e=>{
              console.log(e)
              const scriptTag = document.createElement("script")
              scriptTag.src = "/routes/scripts/add-member.js"
              const target = e.currentTarget
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
              console.log(e)
              const scriptTag = document.createElement("script")
              scriptTag.src = "/routes/scripts/add-subject.js"
              const target = e.currentTarget
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
})