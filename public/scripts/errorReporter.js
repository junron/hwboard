//DoNt toUcHa my eRRor rePoTer
Sentry.init({
  dsn: 'https://6c425ba741364b1abb9832da6dde3908@sentry.io/1199491'
});
Sentry.setUser({
  username: getCookie("name"),
  email: getCookie("email"),
});
Sentry.setExtra("channel",(channel || "none"));


console.log("User context:");
if(console.table){
  console.table({
    username: getCookie("name"),
    email: getCookie("email"),
    channel:(channel || "none")
  });
}else{
  console.log({
    username: getCookie("name"),
    email: getCookie("email"),
    channel:(channel || "none")
  });
}


function setSentryRelease(commitSHA){
  console.log("Current release ",commitSHA);
  Sentry.setExtra("release",commitSHA);
}