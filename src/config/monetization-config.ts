const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export interface SponsorPartnerAd {
  id: string;
  badge: string;
  partnerName: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

export const MONETIZATION_CONFIG = {
  // 1. Kuota Coba Gratis Penuh sebelum terkunci (9x: Sebelum + berulang Sesudah Cepat/Stabil Game)
  freeTrialLimit: 9,

  // 2. Harga Buka Fitur Selamanya (Sekali Bayar Seumur Hidup)
  pricing: {
    lifetimePrice: 4999,
    lifetimeLabel: 'Rp 4.999',
  },

  // 3. Kontak Resmi Layanan Pelanggan & Pemasangan Iklan Sponsor
  adminWhatsApp: env.VITE_ADMIN_WHATSAPP || '6285842229418',
  adminEmail: env.VITE_ADMIN_EMAIL || 'kang.devlp@gmail.com',

  // 4. Konfigurasi Google AdSense Resmi (Otomatis nonaktif 100% bagi pengguna Lifetime Pro)
  adsense: {
    enabled: (env.VITE_ADSENSE_CLIENT_ID ?? 'ca-pub-5580181273559034') !== '',
    clientId: env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-5580181273559034',
    topSlotId: env.VITE_ADSENSE_SLOT_TOP || '',
    bottomSlotId: env.VITE_ADSENSE_SLOT_BOTTOM || '',
  },

  // 5. Banner Sponsor Mandiri (ISP Lokal, Modem 4G/5G, Top-Up Game, & Slot Iklan)
  sponsorAds: [
    {
      id: 'sponsor-modem-gaming',
      badge: 'Mitra Jaringan & Gaming',
      partnerName: 'Solusi Wi-Fi Rumah, Modem 4G/5G & Kebutuhan Gamer Indonesia',
      headline: 'Sinyal Dalam Ruangan Lemah atau Butuh Pasang Wi-Fi Fiber & Modem Antena Luar?',
      description:
        'Konsultasikan rekomendasi router Dual-Band Wi-Fi 6, modem 4G/5G unlocked untuk kartu SIM Indonesia, atau kerja sama ISP lokal di kota Anda.',
      ctaText: 'Info & Konsultasi WA',
      ctaUrl: `https://wa.me/${env.VITE_ADMIN_WHATSAPP || '6285842229418'}?text=${encodeURIComponent(
        'Halo Admin Juru Speedtest, saya ingin bertanya mengenai rekomendasi perangkat jaringan / kerja sama mitra.'
      )}`,
    },
    {
      id: 'sponsor-slot-open',
      badge: 'Slot Iklan Tersedia',
      partnerName: 'Pasang Banner ISP Lokal / RT-RW Net / Toko Voucher Game Anda',
      headline: 'Jangkau Ribuan Gamer & Pengguna Internet Seluler di Seluruh Indonesia',
      description:
        'Tampilkan promosi paket Wi-Fi Fiber, toko top-up Mobile Legends/PUBG/Valorant, atau toko perangkat jaringan Anda tepat di halaman pengujian kecepatan.',
      ctaText: 'Pasang Iklan Sponsor',
      ctaUrl: `https://wa.me/${env.VITE_ADMIN_WHATSAPP || '6285842229418'}?text=${encodeURIComponent(
        'Halo Admin Juru Speedtest, saya tertarik memasang banner iklan sponsor di aplikasi Juru Speedtest.'
      )}`,
    },
  ] as SponsorPartnerAd[],
};

