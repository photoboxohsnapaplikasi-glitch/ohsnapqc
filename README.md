# Gabooth QC & Rekonsiliasi Kasir 5 Cabang (Multi-Device Cloud Edition)

Paket siap upload ke **GitHub Pages**, **Vercel**, atau **Netlify** agar dapat diakses dan tersinkronisasi dari semua perangkat (HP, Tablet, Laptop).

## Isi Paket Upload (`github_pages_gabooth_qc_admin.zip`)
1. `index.html` — Aplikasi utama (sudah terhubung ke 5 Link Spreadsheet Cabang: Cilacap, Majenang, Pemalang, Pekalongan, Kediri dengan fitur Anti-Blokir Cookie Multi-Akun & Fallback Data).
2. `cloud-config.json` — Konfigurasi otomatis URL Cloud & Link 5 Cabang agar HP/device baru langsung tersambung tanpa setting ulang.
3. `Code.gs` — Script Google Apps Script (Backend Spreadsheet otomatis untuk membuat sheet `Database_QC` 9 kolom + 5 sheet `Rekap_Cilacap`, `Rekap_Majenang`, `Rekap_Pemalang`, `Rekap_Pekalongan`, `Rekap_Kediri`, serta otomatis membuat sheet baru saat tambah cabang baru).
4. `manifest.json` & `sw.js` — Progressive Web App (PWA) agar aplikasi bisa di-install ke layar utama HP Android/iOS.
5. `404.html`, `.nojekyll`, `vercel.json`, `_redirects` — File konfigurasi hosting agar tidak error 404 atau diblokir cache saat dibuka di perangkat lain.

## URL Web App Google Apps Script (Sudah Tertanam Otomatis)
`https://script.google.com/macros/s/AKfycbw-hrdX9Ts6lSer3oyWyMUg2LwKbAMuDv_-7kEz9xSBqsQucCVwCAAjg8Hq69VB1I7J/exec`
