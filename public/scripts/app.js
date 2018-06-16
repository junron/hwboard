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
})