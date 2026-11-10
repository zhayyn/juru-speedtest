# Juru Speedtest (`juru-speedtest`)

Instrumen uji kecepatan internet, analisis latensi beban (*Bufferbloat*), perbandingan **Sebelum vs Sesudah**, serta laboratorium optimasi **APN seluruh kartu seluler Indonesia** untuk **Web & Android (Capacitor)** dalam ekosistem **Juru**.

## Konsep Produk & Monetisasi

1. **Coba Gratis 9x Penuh (`9x Free Trial`) → Buka Selamanya Rp 4.999**:
   - Pengguna dapat mencoba fitur **9 kali gratis penuh** (rekam kondisi awal pada jaringan dan area yang sama di hari yang sama tidak mengurangi kuota) agar merasakan perbedaannya saat berpindah lokasi.
   - Setelah kuota 9x uji gratis terpenuhi, pengguna cukup membayar **Rp 4.999 sekali bayar untuk selamanya (`lifetime_pro`)** via QRIS / E-Wallet (Midtrans Snap) atau Kode Voucher — membuka pengujian tanpa batas, Mode Cepat & Presisi, Game Ping Radar, Laboratorium Racik APN Kustom, serta **100% bebas iklan**.
   - Lisensi tersinkronisasi *real-time* lintas perangkat melalui Google Sign-In + Cloud Firestore (`users/{uid}`).
2. **Target Indonesia — Database Lengkap APN Kartu SIM & Telemetri Jaringan Aktif**:
   - Mencakup **31 profil APN autentik Indonesia (MCC `510`)** di 8 kategori operator/sub-brand: **Telkomsel** (Halo/PraBayar), **by.U**, **Indosat Ooredoo Hutchison** (IM3), **Tri (3)**, **XL Axiata** (XL/PRIORITAS/Live.On), **AXIS**, **Smartfren**, serta **Universal / Modem 4G-5G / Router**.
   - Deteksi otomatis jaringan yang sedang dipakai: ISP & ASN seluler/fiber Indonesia, IPv4/IPv6 publik, tipe radio koneksi (`4G/LTE`, `5G`, `Wi-Fi`), estimasi downlink/RTT browser, lokasi kota gateway, dan PoP server Cloudflare Edge Indonesia (`CGK` Jakarta, `SUB` Surabaya, `JOG` Yogyakarta, `DPS` Denpasar, `KNO` Medan, `UPG` Makassar, `BTH` Batam, dll.).
3. **Perbandingan Sebelum vs Sesudah + Pilihan Mandiri (Cepat vs Stabil Main Game)**:
   - Merekam *baseline* awal (**Sebelum**), lalu menyajikan 2 kartu rekomendasi berdampingan:
     - **Pilihan 1 — Rekomendasi Tercepat (`Mode Cepat`)**: Dual-Stack `IPv4/IPv6` tanpa proxy untuk unduhan & streaming 4K maksimal.
     - **Pilihan 2 — Rekomendasi Terstabil (`Stabil Main Game`)**: Kunci `IPv4` murni & bearer `LTE` anti-handover untuk menekan *ping spike* & *jitter* saat bermain Mobile Legends, PUBG Mobile, Valorant, atau Free Fire.
   - Pengguna bebas memilih sendiri profil yang diinginkan, menerapkannya ke HP Android / iOS (`.mobileconfig`) / Modem, menguji ulang (**Sesudah**), dan melihat papan selisih **Sebelum vs Sesudah** + mengunduh kartu bukti PNG `1200×675`.
4. **Iklan & Kepatuhan Regulasi (Midtrans, Google AdSense & UU PDP)**:
   - Integrasi Google AdSense (`ca-pub-5580181273559034`, `public/ads.txt`) dan slot sponsor mitra jaringan/gaming pada akun gratis, otomatis dinonaktifkan bagi pengguna Pro Rp 4.999.
   - Halaman kepatuhan lengkap: `/syarat-ketentuan`, `/kebijakan-privasi`, `/kebijakan-pengembalian`, `/disclaimer`, dan `/kontak`.

## Menjalankan Proyek Secara Lokal

```bash
# 1. Jalankan Frontend Web (http://localhost:3005)
npm install
npm run dev

# 2. Jalankan Pengujian Backend Pembayaran & Voucher (Node >= 22)
cd server
npm install
npm test
```

## Build Produksi, Docker, Cloud Run & Android

```bash
# Type-check & build bundel produksi statis (dist/)
npm run lint
npm run build

# Jalankan via Docker / Nginx (port 8080)
docker compose up --build -d

# Deploy API Pembayaran & Voucher ke Google Cloud Run
cd server
gcloud run deploy juru-speedtest-api --source . --region=asia-southeast2 --project=juruhukum-id

# Sinkronisasi ke Android (Capacitor)
npm run android:sync
npm run android:open
```
