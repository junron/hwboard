//This is a service worker
//It handles caching and PWA
const version = "1.1.4"

console.log(`Service worker verison ${version}`)
self.addEventListener('install', function(e) {
  console.log(`Installed service worker verison ${version}`)
  self.skipWaiting()
  e.waitUntil(
    caches.open('cache1').then(function(cache) {
      const cacheArray = [
        "/styles/roboto.css",
        "/styles/icons.css",
        "/socket.io-client/dist/socket.io.slim.js",
        "/framework7/css/framework7.min.css",
        "/framework7/js/framework7.min.js",
        "/promise-worker/dist/promise-worker.js",
        "/jquery/dist/jquery.slim.min.js",
        "/scripts/app.js",
        "/scripts/generalForms.js",
        "/scripts/worker.js",
        "/dexie/dist/dexie.min.js",
        "/scripts/raven.min.js",
        "/promise-worker/dist/promise-worker.register.js",
        "/fonts/material.ttf",
        "/scripts/renderer.js",
        "/scripts/getCookie.js",
        "/scripts/fastLoadHomework.js",
        "scripts/loadHomework.js",
        "/fonts/KFOlCnqEu92Fr1MmSU5fBBc9.ttf",
        "/fonts/KFOmCnqEu92Fr1Mu4mxP.ttf",
        "/routes/channel-analytics.html",
        "/routes/edit-homework.html",
        "/routes/channel-settings.html",
      ]
      return cache.addAll(cacheArray);
    })
  );
});
function addCacheHeader(response){
  if(response.status!=200||response.type=="opaque"){
    return response
  }
  if((response.url.endsWith(".css")||response.url.endsWith(".ttf")||response.url.indexOf("min")>-1||response.url.indexOf("io")>-1)&&response){
  const newHeaders = new Headers(response.headers);
          newHeaders.append("Cache-Control","public, max-age=31536000");
          const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
          return newResponse
      }else{
        return response
      }
}
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
});
self.addEventListener('fetch', function(event) {
  if(event.request.method=="GET"){
    event.respondWith(
      caches.open('cache1').then(function(cache) {
        return cache.match(event.request).then(function(response) {
          const {url} = event.request
          if((url.endsWith(".css")||url.endsWith(".ttf")||url.indexOf("min")>-1||url.indexOf("io")>-1)&&response){
            return addCacheHeader(response)
          }
          console.log(`Loading ${url}`)
          var fetchPromise = fetch(event.request).then(function(networkResponse) {
            //Dont cache stuffs
            if((!url.includes("?useCache")) &&
             (url.includes("transport=polling") || 
             url.includes("/cd/") || 
             url.includes("checkVersion.js") ||
             url.includes("?noCache"))){
              return networkResponse;
            }
            if(networkResponse.ok){
              cache.put(event.request, networkResponse.clone());
              console.log(`Cached ${url}`)
              return networkResponse;
            }else{
              console.log(`Failed to fetch from network ${url}: Error code ${networkResponse.status} ${networkResponse.statusText}`)
              return response || networkResponse
            }
          })
          return response || fetchPromise;
        })
      })
    );
  }
});
