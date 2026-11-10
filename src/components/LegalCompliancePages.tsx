import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Printer,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';

export type LegalPageSlug = 'terms' | 'privacy' | 'refund' | 'disclaimer' | 'contact';

export const LEGAL_PAGE_ROUTES: Record<
  LegalPageSlug,
  { path: string; aliases: string[]; title: string; shortTitle: string }
> = {
  terms: {
    path: '/syarat-ketentuan',
    aliases: ['/terms', '/terms-and-conditions', '/tos'],
    title: 'Syarat & Ketentuan Layanan (Terms & Conditions)',
    shortTitle: 'Syarat & Ketentuan',
  },
  privacy: {
    path: '/kebijakan-privasi',
    aliases: ['/privacy', '/privacy-policy'],
    title: 'Kebijakan Privasi & Pelindungan Data (Privacy Policy)',
    shortTitle: 'Kebijakan Privasi',
  },
  refund: {
    path: '/kebijakan-pengembalian',
    aliases: ['/refund', '/refund-policy', '/pengiriman-layanan'],
    title: 'Kebijakan Pengiriman Produk Digital & Pengembalian Dana',
    shortTitle: 'Pengembalian Dana',
  },
  disclaimer: {
    path: '/disclaimer',
    aliases: ['/sanggahan-teknis', '/technical-disclaimer'],
    title: 'Sanggahan Teknis Jaringan & APN (Technical Disclaimer)',
    shortTitle: 'Disclaimer Teknis',
  },
  contact: {
    path: '/kontak',
    aliases: ['/tentang-kami', '/about', '/contact'],
    title: 'Tentang Juru Speedtest & Layanan Pelanggan',
    shortTitle: 'Tentang & Kontak',
  },
};

export function resolveLegalSlugFromPathname(pathname: string): LegalPageSlug | null {
  const normalized = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  for (const [slug, cfg] of Object.entries(LEGAL_PAGE_ROUTES) as Array<
    [LegalPageSlug, (typeof LEGAL_PAGE_ROUTES)[LegalPageSlug]]
  >) {
    if (cfg.path === normalized || cfg.aliases.includes(normalized)) {
      return slug;
    }
  }
  return null;
}

interface LegalCompliancePagesProps {
  activePage: LegalPageSlug;
  onSelectPage: (page: LegalPageSlug) => void;
  onBackToApp: () => void;
  onOpenPricing?: () => void;
}

export const LegalCompliancePages: React.FC<LegalCompliancePagesProps> = ({
  activePage,
  onSelectPage,
  onBackToApp,
  onOpenPricing,
}) => {
  const effectiveDate = '9 November 2026';
  const supportEmail = MONETIZATION_CONFIG.adminEmail;
  const waNumberClean = MONETIZATION_CONFIG.adminWhatsApp;
  const waUrl = `https://wa.me/${waNumberClean}?text=${encodeURIComponent(
    'Halo Layanan Pelanggan Juru Speedtest, saya membutuhkan bantuan terkait layanan optimasi jaringan & pembayaran Rp 4.999.'
  )}`;

  const navItems: Array<{ id: LegalPageSlug; label: string; icon: React.ElementType }> = [
    { id: 'terms', label: 'Syarat & Ketentuan', icon: FileText },
    { id: 'privacy', label: 'Kebijakan Privasi', icon: Lock },
    { id: 'refund', label: 'Pengiriman & Refund', icon: RefreshCcw },
    { id: 'disclaimer', label: 'Disclaimer Teknis', icon: AlertTriangle },
    { id: 'contact', label: 'Tentang & Kontak', icon: Building2 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBackToApp}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>Kembali ke Pengujian Jaringan</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Cetak Dokumen Ketentuan</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold tracking-widest text-teal-300 uppercase">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            <span>Dokumen Kepatuhan &amp; Ketentuan Resmi • Juru Speedtest Indonesia</span>
          </span>
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] text-slate-200">
            Berlaku Efektif: {effectiveDate}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl leading-snug font-extrabold tracking-tight text-white sm:text-3xl">
          {LEGAL_PAGE_ROUTES[activePage].title}
        </h1>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
          Ketentuan layanan produk digital, pelindungan privasi data pengguna sesuai UU PDP, standar transaksi elektronik <strong>PT Midtrans</strong>, serta tata kelola aplikasi <strong>Juru Speedtest</strong> di Indonesia.
        </p>

        {/* Sub-Navigation Pills */}
        <div className="mt-6 flex flex-wrap gap-1.5 print:hidden">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-teal-700' : 'text-teal-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <article className="rounded-3xl border border-slate-200 bg-white p-6 leading-relaxed text-slate-700 shadow-xs sm:p-10 dark:border-slate-800 dark:bg-[#0C1221] dark:text-slate-300">
        {/* =========================================================
            PAGE 1: SYARAT & KETENTUAN
           ========================================================= */}
        {activePage === 'terms' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800/50 dark:bg-teal-950/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Ringkasan Transparan Layanan Produk Digital (Coba {MONETIZATION_CONFIG.freeTrialLimit}x Gratis &rarr; Buka Selamanya Rp 4.999)
                  </p>
                  <p>
                    <strong>Juru Speedtest</strong> menyediakan instrumen uji kecepatan jaringan, analisis bufferbloat, perbandingan Sebelum vs Sesudah, serta basis data profil APN seluruh operator seluler Indonesia. Setiap pengguna berhak mencoba fitur secara penuh <strong>{MONETIZATION_CONFIG.freeTrialLimit} (sembilan) kali gratis</strong> (rekam kondisi awal pada jaringan dan hari yang sama tidak mengurangi kuota) sebelum memutuskan membeli akses <strong>Lifetime Pro (Rp 4.999 sekali bayar untuk selamanya)</strong> dalam mata uang <strong>Rupiah Indonesia (IDR)</strong> melalui gerbang pembayaran resmi <strong>PT Midtrans</strong>.
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                1. Penerimaan Syarat &amp; Ketentuan (Conditions of Use)
              </h2>
              <p>
                Penggunaan aplikasi web (<code>https://juruspeedtest.online</code>) maupun aplikasi seluler Android (<code>id.juru.speedtest</code>) <strong>Juru Speedtest</strong> merupakan bentuk persetujuan yang sah dan mengikat secara hukum sesuai Pasal 1320 KUHPerdata juncto Undang-Undang Informasi dan Transaksi Elektronik (UU ITE). Apabila Anda tidak menyetujui bagian mana pun dari ketentuan ini, mohon hentikan penggunaan layanan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                2. Skema Uji Coba Gratis ({MONETIZATION_CONFIG.freeTrialLimit}x) &amp; Tarif Buka Selamanya (IDR)
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    Mode Coba Gratis (Dengan Iklan)
                  </div>
                  <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                    Rp 0 ({MONETIZATION_CONFIG.freeTrialLimit}x Uji Penuh)
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Mencakup {MONETIZATION_CONFIG.freeTrialLimit} kali siklus pengujian kecepatan &amp; perbandingan Sebelum vs Sesudah optimasi APN (Mode Cepat Download/Streaming atau Mode Stabil Gaming) dengan pendeteksian jaringan dan area otomatis.
                  </p>
                </div>

                <div className="rounded-2xl border border-teal-500/40 bg-teal-500/5 p-4">
                  <div className="text-[11px] font-bold text-teal-600 uppercase dark:text-teal-400">
                    Paket Buka Selamanya (Lifetime Pro)
                  </div>
                  <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                    Rp 4.999 (Sekali Bayar)
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Sekali bayar seumur hidup tanpa biaya berlangganan bulanan: membuka pengujian kecepatan tanpa batas, Mode Cepat &amp; Presisi, Game Ping Radar, Laboratorium Racik APN Kustom, ekspor sertifikat PNG, serta 100% bebas iklan selamanya.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pembayaran diproses secara elektronik dan terenkripsi melalui mitra penyedia jasa pembayaran resmi <strong>PT Midtrans</strong> (mendukung QRIS, GoPay, DANA, OVO, ShopeePay, dan Transfer Virtual Account Perbankan Nasional). Aktivasi paket berlangsung secara otomatis setelah konfirmasi pelunasan (<em>settlement</em>) diterima oleh server kami.
              </p>
              {onOpenPricing && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-500 print:hidden"
                >
                  <span>Buka Halaman Aktivasi Rp 4.999</span>
                </button>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                3. Akun Pengguna, Pemberian Lisensi &amp; Larangan Penyalahgunaan
              </h2>
              <p>
                Untuk membeli paket <strong>Lifetime Pro (Rp 4.999)</strong> atau menukarkan kode voucher, Pengguna masuk menggunakan akun <em>Google Sign-In</em> resmi agar status lisensi seumur hidup tersimpan aman di awan dan tetap aktif saat Pengguna berganti ponsel atau memasang ulang aplikasi dari Google Play Store. Lisensi bersifat pribadi, non-eksklusif, dan dilarang diperjualbelikan kembali secara massal, direkayasa balik (<em>reverse engineering</em>), atau disalahgunakan untuk serangan siber.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                4. Hak Kekayaan Intelektual &amp; Hukum yang Berlaku
              </h2>
              <p>
                Seluruh antarmuka perangkat lunak, mesin telemetri jaringan, struktur kode, dan merek layanan <strong>Juru Speedtest</strong> dilindungi oleh Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta. Syarat &amp; Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia.
              </p>
            </section>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p className="font-bold text-slate-800 dark:text-slate-200">Pemberitahuan Hukum (Legal Notice)</p>
              <p>Juru Speedtest dioperasikan sebagai Platform Pengujian Kecepatan Internet &amp; Optimasi Jaringan Mandiri di Indonesia.</p>
              <p>Hak Cipta &copy; {new Date().getFullYear()} Juru Speedtest (<code>juruspeedtest.online</code>). Seluruh Hak Dilindungi Undang-Undang.</p>
            </div>
          </div>
        )}

        {/* =========================================================
            PAGE 2: KEBIJAKAN PRIVASI (UU PDP + MIDTRANS + ADSENSE)
           ========================================================= */}
        {activePage === 'privacy' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800/50 dark:bg-teal-950/20">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Kebijakan Privasi ini disusun sesuai standar <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>, standar keamanan <strong>PT Midtrans</strong>, serta kebijakan periklanan <strong>Google AdSense</strong>.
              </p>
            </div>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                1. Penyimpanan Riwayat Lokal &amp; Penyamaran IP (Privacy Mask)
              </h2>
              <p>
                Riwayat hasil pengujian kecepatan, perbandingan Sebelum vs Sesudah, serta profil APN kustom yang Anda buat disimpan secara lokal di memori peramban perangkat Anda (<code>localStorage</code>). Kami menyediakan tombol <strong>Samarkan IP</strong> agar alamat IP publik Anda disamarkan saat mengambil tangkapan layar atau mengunduh sertifikat PNG.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                2. Data Akun &amp; Keamanan Pembayaran Midtrans
              </h2>
              <p>
                Saat Anda masuk dengan Google dan melakukan pembayaran Rp 4.999, sistem kami hanya menyimpan UID akun Google, alamat email, dan status lisensi <code>lifetime_pro</code> pada Google Cloud Firestore. Seluruh transaksi QRIS, dompet elektronik, dan perbankan diproses langsung oleh <strong>PT Midtrans</strong> (tersertifikasi PCI-DSS Level 1 &amp; berlisensi Bank Indonesia). Juru Speedtest tidak pernah menyimpan PIN, OTP, maupun kredensial rekening Pengguna.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                3. Cookie &amp; Penayangan Iklan Google AdSense
              </h2>
              <p>
                Pada akun gratis, aplikasi dapat menayangkan iklan dari mitra jaringan periklanan resmi termasuk <strong>Google AdSense</strong> yang menggunakan <em>cookie</em> untuk menampilkan iklan yang relevan. Pengguna dapat mengatur preferensi iklan Google melalui{' '}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-teal-600 underline dark:text-teal-400"
                >
                  Pengaturan Iklan Google
                </a>
                . Bagi Pengguna yang telah membuka <strong>Lifetime Pro (Rp 4.999)</strong>, seluruh penayangan iklan dimatikan secara otomatis selamanya.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                4. Kepatuhan Keamanan Data Google Play Store &amp; Hak Penghapusan Data
              </h2>
              <p>
                Sesuai kebijakan Keamanan Data (<em>Data Safety</em>) Google Play Store dan UU PDP, aplikasi ini tidak pernah mengakses kontak pribadi, kamera, mikrofon, SMS, maupun galeri foto tanpa izin. Pengguna dapat menghapus seluruh riwayat pengujian lokal kapan saja melalui tombol <strong>Hapus Riwayat</strong> di dalam aplikasi, atau mengajukan penghapusan data akun awan secara permanen melalui email resmi <strong>{supportEmail}</strong>.
              </p>
            </section>
          </div>
        )}

        {/* =========================================================
            PAGE 3: PENGIRIMAN DIGITAL & KEBIJAKAN REFUND
           ========================================================= */}
        {activePage === 'refund' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                1. Aktivasi Digital Seketika (Instant Digital Delivery)
              </h2>
              <p>
                Paket <strong>Juru Speedtest Pro Selamanya (Rp 4.999)</strong> merupakan produk perangkat lunak digital tanpa pengiriman fisik. Begitu pembayaran QRIS / E-Wallet Anda berstatus lunas (<em>Settlement</em>) di Midtrans, fitur terbuka otomatis dalam hitungan detik pada akun Google Anda tanpa biaya ongkos kirim tambahan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                2. Jaminan Pengembalian Dana 100% (Refund Policy)
              </h2>
              <p>
                Karena kami telah memberikan <strong>{MONETIZATION_CONFIG.freeTrialLimit}x kuota coba gratis penuh</strong> agar Anda merasakan sendiri perbedaannya sebelum membayar Rp 4.999, lisensi digital yang sudah aktif pada prinsipnya bersifat final. Namun demikian, kami memberikan <strong>Jaminan Refund 100%</strong> apabila:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Terjadi pemotongan saldo ganda (<em>double charge</em>) untuk akun yang sama;</li>
                <li>Saldo terpotong namun akses Selamanya gagal aktif dalam 1&times;24 jam dan tim teknis kami tidak dapat mengaktifkannya.</li>
              </ul>
              <p>
                Klaim refund dapat diajukan maksimal 7 hari kalender sejak transaksi dengan mengirimkan bukti bayar / Order ID (<code>JS-LP-...</code>) ke email <strong>{supportEmail}</strong> atau WhatsApp resmi kami. Dana yang disetujui akan dikembalikan ke rekening atau dompet digital asal dalam waktu 3 s/d 7 hari kerja tanpa potongan biaya administrasi.
              </p>
            </section>
          </div>
        )}

        {/* =========================================================
            PAGE 4: DISCLAIMER TEKNIS APN & JARINGAN
           ========================================================= */}
        {activePage === 'disclaimer' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                1. Karakteristik Pengaturan APN &amp; Jaringan Seluler Indonesia
              </h2>
              <p>
                Konfigurasi <em>Access Point Name</em> (APN) yang direkomendasikan oleh Juru Speedtest bekerja secara resmi dan legal dengan mengoptimalkan pemilihan gateway operator, protokol jaringan (Dual-Stack IPv4/IPv6 untuk throughput tinggi vs Pure IPv4 untuk stabilitas latensi game), serta penghapusan proxy lawas yang membatasi aliran paket.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                2. Faktor Fisik Menara BTS &amp; Kuota Operator
              </h2>
              <p>
                Kecepatan akhir dan latensi tetap dipengaruhi oleh kualitas sinyal radio (RSRP/SINR), jarak ke menara BTS terdekat, kepadatan pengguna di lokasi Anda, kebijakan batas pemakaian wajar (FUP) paket kuota masing-masing operator (Telkomsel, by.U, Indosat, Tri, XL, AXIS, Smartfren), serta spesifikasi modem perangkat Anda. Juru Speedtest tidak memodifikasi kuota operator dan tidak berafiliasi langsung dengan merek dagang operator seluler terkait.
              </p>
            </section>
          </div>
        )}

        {/* =========================================================
            PAGE 5: TENTANG & KONTAK
           ========================================================= */}
        {activePage === 'contact' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                Tentang Juru Speedtest Indonesia
              </h2>
              <p>
                <strong>Juru Speedtest</strong> adalah instrumen uji kecepatan internet, analisis <em>Bufferbloat</em>, dan laboratorium perbandingan APN seluler mandiri dalam ekosistem teknologi <strong>Juru</strong> yang dirancang khusus untuk karakteristik jaringan seluler dan gamer di seluruh wilayah Indonesia.
              </p>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Email Resmi &amp; Dukungan Teknis
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Bantuan kendala aktivasi pembayaran Rp 4.999, klaim refund, atau pertanyaan teknis:
                </p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-block text-xs font-extrabold text-teal-600 underline dark:text-teal-400"
                >
                  {supportEmail}
                </a>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  WhatsApp Pelanggan &amp; Mitra Iklan
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Konfirmasi cepat aktivasi voucher atau pemasangan slot iklan ISP / Voucher Game:
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Chat WhatsApp</span>
                  </a>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    +62 858-4222-9418
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Ekosistem</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Juru Speedtest Indonesia</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Layanan Bantuan</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Senin – Sabtu, 08.00 – 20.00 WIB (Otomatis 24/7)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cakupan Operator</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Seluruh Operator Seluler &amp; ISP Republik Indonesia
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

