# Juru Speedtest API

API pembayaran, voucher, dan aktivasi paket **Juru Speedtest Pro Selamanya (Rp 4.999)** berbasis Express + Firebase Admin SDK + Midtrans Snap/QRIS. Berjalan di Google Cloud Run / Node 22+ dengan penyimpanan Firestore.

## Endpoint

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/health` | – | Cek status server (`checkout: true` bila kunci Midtrans terpasang) |
| POST | `/api/redeem-voucher` | Firebase ID token | `{ code }` → aktifkan paket `lifetime_pro` dari voucher (dibatasi 8 percobaan / 10 menit) |
| POST | `/api/checkout` | Firebase ID token | `{ plan: "lifetime_pro" }` → `{ orderId, token, redirectUrl }` halaman bayar QRIS / Midtrans Snap (Rp 4.999 ditentukan mutlak di server) |
| POST | `/api/sync-order` | Firebase ID token | `{ orderId }` → periksa status resmi ke Midtrans & aktifkan akses selamanya bila lunas |
| POST | `/api/midtrans-webhook` | Signature SHA-512 Midtrans | Notifikasi pembayaran otomatis (status diverifikasi ulang ke Midtrans & bersifat idempoten) |

## Konfigurasi Environment (Cloud Run / Server)

| Variabel | Keterangan |
|---|---|
| `MIDTRANS_SERVER_KEY` | Kunci rahasia server Midtrans (`SB-Mid-server-...` atau `Mid-server-...`). Kosong = checkout online nonaktif |
| `MIDTRANS_IS_PRODUCTION` | `false` = sandbox, `true` = produksi |
| `VOUCHER_LIFETIME_PRO` | Daftar kode voucher akses selamanya dipisah koma (mis. `JURUSPEED,GAMER4999`) |
| `ALLOWED_ORIGINS` | Daftar origin web yang diizinkan memanggil API |
| `APP_URL` | URL web tujuan redirect setelah pembayaran selesai |
| `GOOGLE_CLOUD_PROJECT` | ID proyek Firebase/GCP (default `juruhukum-id`) |

## Pengujian & Deploy Cloud Run

```bash
cd server
npm install
npm test
gcloud run deploy juru-speedtest-api --source . --region=asia-southeast2 --project=juruhukum-id
```

Koleksi Firestore:
- `users/{uid}`: menyimpan `speedtestPlan: "lifetime_pro"`, `speedtestPlanExpiresAt: null`, `speedtestPlanSource` dengan `{ merge: true }` sehingga aman berbagi proyek Firebase tanpa menimpa dokumen aplikasi lain. Klien hanya boleh membaca dokumen miliknya sendiri (`../firestore.rules`).
- `speedtest_orders/{orderId}`: catatan transaksi pesanan (hanya dapat diakses oleh server Admin SDK).

