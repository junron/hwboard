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
      animate:false,
      url:"/"
    }
  ],
  dialog:{
    title: 'Hwboard',
  }
})