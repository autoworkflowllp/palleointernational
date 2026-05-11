// Palleo SuiteX — Service Worker
var CACHE = 'palleo-v1';
var SHELL = ['./'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Only cache same-origin shell — let GAS requests pass through
  if (e.request.url.indexOf('script.google.com') >= 0) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).catch(function(){
        return caches.match('./');
      });
    })
  );
});
