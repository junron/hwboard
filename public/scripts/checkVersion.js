(async ()=>{
  const promises = [
    fetch("/cd/version.json?useCache")
      .then(res=>res.json()),
    fetch("/cd/version.json?noCache")
      .then(res=>res.json())
  ];
  const result = await Promise.all(promises);
  if(typeof setSentryRelease === "function"){
    setSentryRelease(result[0].commitSha);
  }
  // New commit, refresh cache and reload page
  if(result[1].commitSha != result[0].commitSha){
    console.log("New version released!!");
    console.log(`Upgrading from version ${result[0].commitSha} to ${result[1].commitSha}`);
    await caches.delete("cache1");
    if ('serviceWorker' in navigator) {
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.unregister();
    }
    location.reload();
  }
})();
