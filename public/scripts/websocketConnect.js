const conn = io(location.origin,{secure: true});
//Handle websocket connection errors
//Standard code for all my websocket apps
if(!navigator.onLine){
  $("#connection-status").text(`Offline`);
}
conn.on("connect_error",function(e){
  if(navigator.onLine==undefined){
    //Some browsers may not support navigator.onLine
    //EDIT: appears that most browsers support but meh
    //https://caniuse.com/#feat=online-status
    if(typeof Raven !="undefined"){
      Raven.captureException(new Error("error checking connection status"));
    }
    $("#connection-status").text(`Error checking connection state`);
    return;
  }
  if(navigator.onLine){
    //Its a server problem, perhaps websocket server not started
    $("#connection-status").text(`Error connecting to server`);
    if(typeof Raven !="undefined"){
      Raven.captureException(e);
    }
  }else{
    $("#connection-status").text(`Offline`);
    //Load data from cache since user is offline
  }
})
conn.on("disconnect",function(){
  $("#connection-status").text("Disconnected");
})
conn.on("connect",function(){
  $("#connection-status").text("Connected");
  $(document).ready(function(){
      $('img').each(function(){

          var date = new Date;
          // add the current unix timestamp in microseconds to the the image src as a query string
          this.src = this.src + '?' + date.getTime();
      });

  });
})

//Uncaught error that could not be handled via callback etc
conn.on("uncaughtError",error=>{
  Framework7App.dialog.alert(error);
  throw new Error(error);
})