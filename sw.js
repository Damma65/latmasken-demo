self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('latmasken-v1').then(cache=>cache.addAll(['/', '/manifest.webmanifest'])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
});