/**
 * Service Worker Production-Ready (Network-First Strategy)
 * Menjamin semua pengguna di HP & Laptop selalu mendapatkan versi terbaru dan data real-time,
 * sekaligus tetap bisa membuka aplikasi saat sinyal lemah.
 */
const CACHE_NAME = 'gabooth-qc-admin-v2';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './cloud-config.json'];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Gunakan Network-First agar data & update terbaru di GitHub Pages selalu langsung muncul di semua HP
  event.respondWith(
    fetch(req)
      .then(function (networkResp) {
        if (networkResp && networkResp.status === 200 && req.url.startsWith(self.location.origin)) {
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copy);
          });
        }
        return networkResp;
      })
      .catch(function () {
        return caches.match(req);
      })
  );
});
