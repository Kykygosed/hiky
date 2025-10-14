const CACHE_NAME = 'KykyProject';
const FILES_TO_CACHE = [
'./',
'./index.html',
'./manifest.json',
'./offline.html'
];

self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
);
});

self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then(keys => Promise.all(keys.map(key => {
if (key !== CACHE_NAME) return caches.delete(key);
})))
);
});

self.addEventListener('fetch', (event) => {
event.respondWith(
fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('/offline.html')))
);
});
