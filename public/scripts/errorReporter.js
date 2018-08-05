(()=>{
  //DoNt toUcHa my eRRor rePoTer
  const thisChannel = channel || "none"
  Raven.config('https://6c425ba741364b1abb9832da6dde3908@sentry.io/1199491').install()
  Raven.setUserContext({
    name: getCookie("name"),
    email: getCookie("email"),
    channel:thisChannel
  })
})()