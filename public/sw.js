//This is a service worker
//It handles cacheing and PWA
const version = "1.0.1"

console.log(`Service worker verison ${version}`)
self.addEventListener('install', function(e) {
  console.log(`Installed service worker verison ${version}`)
  self.skipWaiting()
  e.waitUntil(
    caches.open('cache1').then(function(cache) {
      return cache.addAll([
        "/styles/roboto.css",
        "/styles/icons.css",
        "/scripts/socket.io.js",
        "/framework7/css/framework7.css",
        "/framework7/js/framework7.js",
        "/scripts/promise-worker.js",
        "/scripts/jquery.min.js",
        "/scripts/app.js",
        "/scripts/generalForms.js",
        "/scripts/worker.js",
        "/scripts/dexie.min.js",
        "/scripts/raven.min.js",
        "/scripts/promise-worker.register.js",
        "/fonts/material.ttf",
        "/fonts/KFOlCnqEu92Fr1MmSU5fBBc9.ttf",
        "/fonts/KFOmCnqEu92Fr1Mu4mxP.ttf"
      ]);
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
self.addEventListener('fetch', function(event) {
  if(event.request.method=="GET"){
    event.respondWith(
      caches.open('cache1').then(function(cache) {
        return cache.match(event.request).then(function(response) {
          if((event.request.url.endsWith(".css")||event.request.url.endsWith(".ttf")||event.request.url.indexOf("min")>-1||event.request.url.indexOf("io")>-1)&&response){
            return addCacheHeader(response)
          }
          var fetchPromise = fetch(event.request).then(function(networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          return response || fetchPromise;
        })
      })
    );
  }
});
