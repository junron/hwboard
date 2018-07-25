//WebKit bug where variable declared with const or let
//Cant have the same name as an id
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
const theme = getParameterByName("theme") || "md"//"auto"
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
        name:"edit-homework",
        path: "/popups/edit/",
        url:"/routes/edit-homework.html",
        on :{
          pageInit:function(e,page){
            const edit = page.route.url.includes("?edit=true")
            if(edit){
              $("#edit-title").text("Edit homework")
              startEdit()
            }else{
              $("#edit-title").text("Add homework")
            }
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