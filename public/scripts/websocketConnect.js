const conn = io(location.origin,{
  secure: true,
  reconnectionDelay:100,
});
//Handle websocket connection errors
//Standard code for all my websocket apps
if(!navigator.onLine){
<<<<<<< HEAD
    $("#connection-status").text(`Offline`);
=======
  $("#connection-status").text(`Offline`);
>>>>>>> e9081b508459aaeb55aee2f92e6f9e0364c2ae5e
}
conn.on("connect_error",function(e){
  if(navigator.onLine==undefined){
    //Some browsers may not support navigator.onLine
    //EDIT: appears that most browsers support but meh
    //https://caniuse.com/#feat=online-status
    if(typeof Raven !="undefined"){
<<<<<<< HEAD
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
=======
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
>>>>>>> e9081b508459aaeb55aee2f92e6f9e0364c2ae5e
    //Load data from cache since user is offline
  }
});
conn.on("disconnect",function(){
<<<<<<< HEAD
    $("#connection-status").text("Disconnected");
});
conn.on("connect",function(){
    $("#connection-status").text("Connected");
    $(document).ready(function () {
        $('img').each(function () {

            var date = new Date;
            // add the current unix timestamp in microseconds to the the image src as a query string
            this.src = this.src + '?' + date.getTime();
        });

    });
});

//Uncaught error that could not be handled via callback etc
conn.on("uncaughtError",error=>{
    Framework7App.dialog.alert(error);
    throw new Error(error);
});
=======
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
>>>>>>> e9081b508459aaeb55aee2f92e6f9e0364c2ae5e
