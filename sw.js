// Bump VERSION (and app.js?v= in index.html) on every release.
// Network first, bypassing the HTTP cache, so updates show up right away; cache is the offline fallback.
const VERSION = 32;
const CACHE = 'habits-v' + VERSION;
const ASSETS = ['./', 'index.html', 'app.js?v=' + VERSION, 'icons.js?v=' + VERSION, 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
