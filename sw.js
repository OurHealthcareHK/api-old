---
---

const version = '{{site.time | date: '%Y%m%d%H%M%S'}}';
const prefix = "openmedicshk::";
const staticCacheName = prefix+version;

const filesToCache = [
  "/",
  {% for page in site.html_pages %}
    '{{ page.url }}',
  {% endfor %}
  {% for post in site.posts %}
    '{{ post.url }}',
  {% endfor %}
  {% for file in site.static_files %}
    '{{ file.path }}',
  {% endfor %}
];


self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      console.log("Installing new worker "+staticCacheName);
      return cache.addAll(filesToCache);
    })
  )
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.filter(function(cacheName){
          return cacheName.startsWith(prefix)
            && cacheName != staticCacheName;
        }).map(function(cacheName){
          console.log("Deleting cache "+cacheName);
          return caches.delete(cacheName);
        })
      )
    })
  )
});


function onlineFirst(e, cacheResponse){  
      return caches.open(staticCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        }).catch(function(error) {
          if (cacheResponse){
            return cacheResponse;
          }
        });
      });
}

function cacheFirst(e, cacheResponse){  
  if (cacheResponse)
    return cacheResponse;
  else
    return caches.open(staticCacheName).then(function(cache) {
      return fetch(e.request).then(function(response){
        cache.put(e.request.url, response.clone());
        return response;
      });
    });
}

self.addEventListener("fetch", function(e){
  e.respondWith(
    caches.match(e.request).then(function(cacheResponse) {
      console.log("fetching "+e.request);
      if (filesToCache.indexOf(e.request.url) > -1)
        return cacheFirst(e, cacheResponse);
      else
        return onlineFirst(e, cacheResponse);
     })
   )
});
