;(async ()=>{
  const promises = [
    fetch("/cd/version.json")
    .then(res=>res.json()),
    fetch("/cd/version.json?noCache")
    .then(res=>res.json())
  ]
  const result = await Promise.all(promises)
  // New commit, refresh cache and reload page
  if(result[1].commitSha != result[0].commitSha){
    await caches.delete("cache1")
    location.reload()
  }
})()