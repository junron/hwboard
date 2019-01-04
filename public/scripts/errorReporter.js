//DoNt toUcHa my eRRor rePoTer
Raven.config('https://6c425ba741364b1abb9832da6dde3908@sentry.io/1199491').install();
Raven.setUserContext({
  username: getCookie("name"),
  email: getCookie("email"),
  channel:(channel || "none")
});

console.log("User context:");
console.table({
  username: getCookie("name"),
  email: getCookie("email"),
  channel:(channel || "none")
});

function setSentryRelease(commitSHA){
  console.log("Current release ",commitSHA);
  Raven.setRelease({
    release: commitSHA
  });
}