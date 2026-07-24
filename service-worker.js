const CACHE_NAME = 'lifeos-cache-v1';
const PRECACHE_URLS = [
  './life-os.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية: جرّب الشبكة الأول (عشان بيانات Supabase تفضل حية)، ولو فشل رجّع من الكاش
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // طلبات Supabase (API/Auth/Realtime) ما نتدخلش فيها خالص
  if (req.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./life-os.html')))
  );
});
