# Paket Lengkap Deploy GitHub Pages / Vercel / Hosting — Gabooth QC & Rekonsiliasi 5 Cabang

Seluruh elemen di dalam paket ZIP ini sudah disiapkan agar **berjalan lancar di semua perangkat (HP Android, iPhone, Tablet, dan Laptop)** tanpa kendala cache maupun data terpisah.

## Daftar Elemen Penting di Dalam ZIP Ini (Upload Semuanya ke GitHub)
1. **`index.html`**: Aplikasi utama (Rekonsiliasi 5 Cabang, QC 3 Pengecekan Persisten & Cross-Match, Database QC 9 Kolom + Auto-Clear, & Kamera EOS).
2. **`cloud-config.json`**: File konfigurasi terpusat yang dibaca otomatis oleh semua HP/Laptop saat membuka web.
3. **`manifest.json`**: Konfigurasi PWA agar web bisa di-install ke layar utama HP (*Add to Home Screen*).
4. **`sw.js`**: *Service Worker* dengan strategi *Network-First* agar aplikasi ringan dibuka di HP namun selalu menampilkan data & versi terbaru.
5. **`404.html`** & **`.nojekyll`**: Penjaga rute otomatis dan percepatan publikasi di GitHub Pages.
6. **`vercel.json`** & **`_redirects`**: Konfigurasi *anti-stale-cache* jika di-deploy di Vercel atau Netlify.
7. **`Code.gs`**: Script Google Apps Script (dipasang di Google Spreadsheet Anda) untuk menyinkronkan data ke semua perangkat dan memisahkan output ke 12 Sheet berbeda.

## Cara Agar Semua Pengguna di HP / Device Lain Langsung Melihat Data yang Sama
1. Pasang isi **`Code.gs`** di Google Spreadsheet Anda (**Extensions > Apps Script > Deploy > New deployment > Web app > Anyone**), lalu salin URL `.../exec`-nya.
2. Buka web Anda, klik tombol **`📲 Akses Semua Device`** di pojok kanan atas:
   - Tempel URL `.../exec` tadi, lalu klik **`💾 Simpan & Sinkronkan Sekarang`**.
   - Klik **`🚀 Download index.html (Tertanam Semua URL)`** (atau **`📄 Download cloud-config.json`**) lalu upload ke repositori GitHub Anda.
   - Begitu ter-upload di GitHub, **semua orang yang membuka link GitHub Pages Anda dari HP atau Laptop mana pun akan langsung terhubung otomatis tanpa perlu memasukkan link lagi!**
