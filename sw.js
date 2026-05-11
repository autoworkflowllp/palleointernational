// Palleo SuiteX Service Worker v3
var CACHE_NAME = 'palleo-suitex-v3';
var SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function(e) {
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    }).then(function() {
      console.log('[SW] Shell cached');
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Pass through all non-shell requests (GAS, Google APIs, etc.)
  if (url.indexOf('script.google.com') >= 0 ||
      url.indexOf('googleapis.com') >= 0 ||
      url.indexOf('google.com') >= 0) {
    return; // let browser handle normally
  }
  // Cache-first for shell files
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        return resp;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
