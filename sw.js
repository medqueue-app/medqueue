const CACHE_NAME = 'medqueue-v1';
const ASSETS = [
  './index.html',
  './pilih_role.html',
  './login_pasien.html',
  './dashboard_pasien.html',
  './ambil_antrean_pilih_poli.html',
  './detail_poli.html',
  './konfirmasi_antrean.html',
  './barcode_status_antrean.html',
  './pasien_sedang_dilayani.html',
  './pelayanan_selesai_pasien.html',
  './riwayat_antrean.html',
  './pengaturan.html',
  './penutup.html',
  './scan_qr_kode_pasien.html',
  './hasil_scan_barcode.html',
  './manifest.json',
  './medqueue_logo.png',
  './js/queue.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
