const CACHE_NAME = 'medqueue-v6';
const ASSETS = [
    './index.html',
    './dashboard_pasien.html',
    './dashboard_admin.html',
    './dashboard_admin_utama.html',
    './ambil_antrean_pilih_poli.html',
    './detail_poli.html',
    './konfirmasi_antrean.html',
    './barcode_status_antrean.html',
    './pasien_sedang_dilayani.html',
    './pelayanan_selesai_pasien.html',
    './login_admin.html',
    './login_pasien.html',
    './daftar_admin.html',
    './daftar_pasien.html',
    './scan_barcode_pasien.html',
    './verifikasi_berhasil.html',
    './admin_memanggil_antrean_b_11.html',
    './admin_sedang_melayani.html',
    './admin_pelayanan_selesai.html',
    './kelola_daftar_antrean.html',
    './daftar_antrean_pasien_admin.html',
    './penutup.html',
    './js/queue.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
