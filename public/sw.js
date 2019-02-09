//This is a service worker
//It handles caching and PWA

//Promise worker for promise based-sw communication
importScripts("/promise-worker/dist/promise-worker.register.js");

const version = "1.3.9";

console.log(`Service worker version ${version}`);
self.addEventListener('install', function(e) {
  console.log(`Installed service worker version ${version}`);
  e.waitUntil((async()=>{
    await self.skipWaiting();
    return caches.open('cache1').then(function(cache) {
      const cacheArray = [
        "/styles/roboto.css",
        "/styles/icons.css",
        "/socket.io-client/dist/socket.io.slim.js",
        "/framework7/css/framework7.min.css",
        "/framework7/js/framework7.min.js",
        "/promise-worker/dist/promise-worker.js",
        "/jquery/dist/jquery.slim.min.js",
        "/scripts/app.js",
        "/scripts/core.js",
        "/scripts/generalForms.js",
        "/scripts/worker.js",
        "/dexie/dist/dexie.min.js",
        "/scripts/raven.min.js",
        "/promise-worker/dist/promise-worker.register.js",
        "/fonts/material.ttf",
        "/scripts/renderer.js",
        "/scripts/getCookie.js",
        "/scripts/fastLoadHomework.js",
        "/scripts/loadHomework.js",
        "/fonts/KFOlCnqEu92Fr1MmSU5fBBc9.ttf",
        "/fonts/KFOmCnqEu92Fr1Mu4mxP.ttf",
        "/routes/channel-analytics.html",
        "/channels",
        "/routes/edit-homework.html",
        "/routes/channel-settings.html",
        "/manifest.json",
        "/images/icons/favicon.png",
      ];
      return cache.addAll(cacheArray);
    });
  })());
});

const createResponse = (data,headers) => new Response(
  data ? new Blob(data.data,{type:data.type}) : new Blob(),
  headers);

function addCacheHeader(response){
  if(response.status!=200||response.type=="opaque"){
    return response;
  }
  if((response.url.endsWith(".css")||response.url.endsWith(".ttf")||response.url.indexOf("min")>-1||response.url.indexOf("io")>-1)&&response){
    const newHeaders = new Headers(response.headers);
    newHeaders.append("Cache-Control","public, max-age=31536000");
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    return newResponse;
  }else{
    return response;
  }
}
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',function(event) {
  if(event.request.url.includes("?code") || event.request.url.includes("sw.js")||event.request.url.includes("authorize")){
    return false;
  }
  if(event.request.method=="GET"){
    event.respondWith(
      caches.open('cache1').then(async function(cache) {
        let queryString;
        const client = await clients.get(event.clientId);
        if(!client){
          queryString = "";
        }else{
          const clientURL = client.url;
          queryString = clientURL.split("?")[clientURL.split("?").length-1];
        }

        return cache.match(event.request).then(function(response) {
          const {url} = event.request;
          if((url.endsWith(".css")||url.endsWith(".ttf")||url.indexOf("min")>-1||url.indexOf("io")>-1)&&response){
            return addCacheHeader(response);
          }
          console.log(`Loading ${url}`);
          const fetchPromise = new Promise(resolve=>{
            const timer = setTimeout(()=>{
              console.log(`Network timed out for ${url}`);
              resolve(createResponse({
                data:["<h1>Request timed out</h1><h2>Please try again later</h2>"],
                type:"text/html"
              },{
                status:500,
                statusText:"Request timed out"
              }));
            },5000);
            fetch(event.request)
              .then(response=>{
                clearTimeout(timer);
                resolve(response);
              });
          })
            .then(networkResponse=>{
            //Dont cache stuffs
              if((!url.includes("?useCache")) &&
             (url.includes("transport=polling") || 
             url.includes("/cd/") || 
             url.includes("checkVersion.js") ||
             url.includes("api/") ||
             url.includes("?noCache"))){
                return networkResponse;
              }
              if(networkResponse.ok){
              //Request successful, add to cache
                cache.put(event.request, networkResponse.clone());
                console.log(`Cached ${url}`);
                //For debugging and testing - Delay loading
                if(queryString.includes("delay=")){
                  const delayScripts = queryString.replace("delay=","").split(",");
                  let delay = false;
                  for(const delayScript of delayScripts){
                    if(url.includes(delayScript) /* || Math.random()>0.5 */){
                      delay = true;
                      console.log(`%c Delayed ${url.split("/")[url.split("/").length-1]}`,"color:red");
                      return new Promise(resolve=>{
                        setTimeout(()=>{
                          resolve(networkResponse);
                        },3000);
                      });
                    }
                  }
                  if(!delay){
                    return networkResponse;
                  }
                }else{
                  return networkResponse;
                }
                //Something went wrong
              }else{
              //Redirect user to microsoft login
              //https://github.com/whatwg/fetch/issues/127
                if(networkResponse.ok!==false || networkResponse.type=="opaqueredirect"){
                  return networkResponse;
                }
                //Other network error
                console.log(`Failed to fetch from network ${url}: Error code ${networkResponse.status} ${networkResponse.statusText}`);
                if(!response){
                //Likely 404
                  console.log("No cached response, returning errored response");
                  return networkResponse;
                }
                //Maybe server down
                return response;
              }
            })
            .catch(e=>{
              console.log("An error occurred:",e);
              return response;
            });
          if(queryString.includes("delay=")){
            return fetchPromise;
          }else{
            return response || fetchPromise;
          }
        });
      })
    );
  }
});

const syncs = {};

registerPromiseWorker(async function (msg) {
  if(msg.type==="sync"){
    const {data} = msg;
    const id = `${Math.random().toString().slice(2)}-${Math.random().toString().slice(2)}-${Math.random().toString().slice(2)}-${Math.random().toString().slice(2)}`;
    syncs[id] = {data};
    console.log(id,syncs);
    self.registration.sync.register(id);
    return id;
  }
});

self.addEventListener("sync",async event =>{
  console.log(event);
  //event.waitUntil((async ()=>{
  //Is hwboard-sync
  if(event.tag.split("-").length===4 && syncs[event.tag]){
    const sync = syncs[event.tag];
    const {data,} = sync;
    const {url,options} = data;
    let action;
    if(url.includes("add")){
      action="added.";
    }else if(url.includes("edit")){
      action="edited.";
    }else if(url.includes("delete")){
      action="deleted.";
    }
    const response = await fetch(url,options);
    const title = "Hwboard";
    const notifOptions = {
      icon:"/images/icons/favicon.png",
    };

    if(response.ok){
      console.log(await response.json());
      if(action===undefined){
        notifOptions.body = "Your request has succeeded";
      }else{
        notifOptions.body = "Homework " + action;
      }
    }else{
      notifOptions.body = "Failed: " + await response.text();
    }
    return self.registration.showNotification(title, notifOptions);
  }
  //})())
});
