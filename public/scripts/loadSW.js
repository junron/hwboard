if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {scope: '/'}).then(reg=>{
    console.log('Registration succeeded. Scope is ' + reg.scope);
  })
    .then(function () {
      if (navigator.serviceWorker.controller) {
      // already active and controlling this page
        return navigator.serviceWorker;
      }
      // wait for a new service worker to control this page
      return new Promise(function (resolve) {
        function onControllerChange() {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve(navigator.serviceWorker);
        }
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      });
      // return navigator.serviceWorker.getRegistration
    }).then(function (worker) { // the worker is ready
      console.log("Loaded promise sw");
      promiseServiceWorker = new PromiseWorker(worker);
    })
    .catch(function(error) {
      console.log('Registration failed with ' + error);
    });
  //navigator.serviceWorker.ready.then(sw => sw.update())
}