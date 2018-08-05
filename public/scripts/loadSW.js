if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {scope: '/'}).then
  (reg=>{
    reg.update()
    console.log('Registration succeeded. Scope is ' + reg.scope)
  }).catch(function(error) {
    console.log('Registration failed with ' + error)
  })
}