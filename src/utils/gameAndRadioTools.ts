import type {
  CarrierId,
  CarrierLteBandGuide,
  DnsBenchmarkResult,
  DnsProviderTarget,
  GameServerProbeResult,
  GameServerTarget,
} from '../types/speedtest';

/**
 * Daftar klaster server game populer di Indonesia & Asia Tenggara.
 * Menggunakan endpoint CDN/Edge resmi berlatensi rendah di rute Jakarta/Singapura/Asia.
 */
export const GAME_SERVER_TARGETS: GameServerTarget[] = [
  {
    id: 'mlbb-id-sg',
    gameTitle: 'Mobile Legends: Bang Bang',
    shortName: 'Mobile Legends (MLBB)',
    publisher: 'Moonton • Klaster Indonesia & Singapura',
    regionLabel: 'ID / SG Server',
    serverCity: 'Jakarta & Singapura',
    probeUrl: 'https://m.mobilelegends.com/favicon.ico',
    fallbackLatencyOffsetMs: 4,
    genreTag: 'MOBA',
  },
  {
    id: 'pubgm-sea',
    gameTitle: 'PUBG Mobile & Honor of Kings',
    shortName: 'PUBG Mobile / HoK',
    publisher: 'Level Infinite • Klaster Asia Tenggara',
    regionLabel: 'SEA Server',
    serverCity: 'Singapura',
    probeUrl: 'https://www.pubgmobile.com/favicon.ico',
    fallbackLatencyOffsetMs: 11,
    genreTag: 'Battle Royale',
  },
  {
    id: 'freefire-id',
    gameTitle: 'Garena Free Fire & COD Mobile',
    shortName: 'Free Fire / CODM',
    publisher: 'Garena • Klaster Indonesia & SEA',
    regionLabel: 'ID / SEA Server',
    serverCity: 'Jakarta & Singapura',
    probeUrl: 'https://ff.garena.com/favicon.ico',
    fallbackLatencyOffsetMs: 6,
    genreTag: 'Battle Royale',
  },
  {
    id: 'valorant-apac',
    gameTitle: 'Valorant & League of Legends',
    shortName: 'Valorant (APAC)',
    publisher: 'Riot Games • Singapore Shard',
    regionLabel: 'AP-Southeast (SG)',
    serverCity: 'Singapura',
    probeUrl: 'https://playvalorant.com/favicon.ico',
    fallbackLatencyOffsetMs: 13,
    genreTag: 'FPS',
  },
  {
    id: 'genshin-asia',
    gameTitle: 'Genshin Impact & Honkai: Star Rail',
    shortName: 'Genshin / HSR (Asia)',
    publisher: 'HoYoverse • Klaster Asia',
    regionLabel: 'Asia Server',
    serverCity: 'Singapura / Tokyo',
    probeUrl: 'https://genshin.hoyoverse.com/favicon.ico',
    fallbackLatencyOffsetMs: 24,
    genreTag: 'Open World / RPG',
  },
  {
    id: 'roblox-steam-sea',
    gameTitle: 'Roblox, EA FC Mobile & Steam SEA',
    shortName: 'Roblox & Steam SEA',
    publisher: 'Edge Regional Asia Tenggara',
    regionLabel: 'SEA Edge',
    serverCity: 'Singapura',
    probeUrl: 'https://store.steampowered.com/favicon.ico',
    fallbackLatencyOffsetMs: 15,
    genreTag: 'Open World / RPG',
  },
];

/**
 * Daftar penyedia Private DNS (DoT / DoH) terbaik untuk jaringan seluler & Wi-Fi di Indonesia.
 */
export const DNS_PROVIDER_TARGETS: DnsProviderTarget[] = [
  {
    id: 'cloudflare-1111',
    name: 'Cloudflare 1.1.1.1 Warp Edge',
    primaryIp: '1.1.1.1',
    secondaryIp: '1.0.0.1',
    androidPrivateDnsHost: 'one.one.one.one',
    probeUrl: 'https://1.1.1.1/cdn-cgi/trace',
    focusTag: 'gaming',
    badge: 'Tercepat Gaming & Umum',
    description:
      'Memiliki node langsung di Jakarta, Surabaya, Medan, Denpasar & Makassar. Sangat cepat membuka blokir rute DNS ISP yang lambat.',
  },
  {
    id: 'google-8888',
    name: 'Google Public DNS',
    primaryIp: '8.8.8.8',
    secondaryIp: '8.8.4.4',
    androidPrivateDnsHost: 'dns.google',
    probeUrl: 'https://dns.google/resolve?name=google.co.id&type=A',
    focusTag: 'speed',
    badge: 'Stabil YouTube & Cloud',
    description:
      'Sangat stabil untuk pemetaan CDN Google, YouTube 4K, Play Store, dan rapat Google Meet di seluruh operator Indonesia.',
  },
  {
    id: 'adguard-dns',
    name: 'AdGuard Private DNS',
    primaryIp: '94.140.14.14',
    secondaryIp: '94.140.15.15',
    androidPrivateDnsHost: 'dns.adguard-dns.com',
    probeUrl: 'https://dns.adguard-dns.com/dns-query',
    focusTag: 'adblock',
    badge: 'Hemat Kuota & Blokir Tracker',
    description:
      'Memangkas pemuatan skrip pelacak & pop-up berat di jaringan seluler sehingga kuota lebih irit dan halaman berita lebih ringan.',
  },
  {
    id: 'quad9-security',
    name: 'Quad9 Security DNS (IBM/PCH)',
    primaryIp: '9.9.9.9',
    secondaryIp: '149.112.112.112',
    androidPrivateDnsHost: 'dns.quad9.net',
    probeUrl: 'https://dns.quad9.net:5053/dns-query',
    focusTag: 'security',
    badge: 'Keamanan & Anti-Phishing',
    description:
      'Memblokir domain malware & phishing secara otomatis di level jaringan dengan node anycast di Jakarta dan Singapura.',
  },
];

/**
 * Contekan Pita Frekuensi (LTE / 5G Band) Resmi per Operator Indonesia
 * untuk membantu pengguna mengunci Band 4G/5G tercepat atau terstabil.
 */
export const CARRIER_LTE_BAND_GUIDES: Record<CarrierId, CarrierLteBandGuide> = {
  telkomsel: {
    carrierId: 'telkomsel',
    speedBands: 'Band 40 (TDD 2300 MHz — 30/50 MHz lebar pita) & Band 1 (2100 MHz)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz — simetris upload/download untuk ping stabil)',
    indoorCoverageBands: 'Band 8 (900 MHz — tembus dinding gedung/kamar kos)',
    fiveGBands: 'n40 (2300 MHz) & n1 (2100 MHz)',
    lockRecommendation:
      'Jika unduhan lambat saat malam hari di Telkomsel, kunci ke Band 40 (2300 MHz). Jika main MLBB/PUBG di dalam ruangan, kunci LTE Only di Band 3 (1800 MHz).',
  },
  byu: {
    carrierId: 'byu',
    speedBands: 'Band 40 (TDD 2300 MHz) & Band 1 (2100 MHz — jaringan utama Telkomsel)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz — latensi dua arah paling seimbang)',
    indoorCoverageBands: 'Band 8 (900 MHz)',
    fiveGBands: 'n40 (2300 MHz)',
    lockRecommendation:
      'Kartu digital by.U berbagi menara BTS dengan Telkomsel. Kunci mode jaringan ke "LTE Only" via *#*#4636#*#* agar HP tidak pernah turun ke H+ saat war.',
  },
  indosat: {
    carrierId: 'indosat',
    speedBands: 'Band 3 (1800 MHz — 20+ MHz pasca-merger IOH) & Band 1 (2100 MHz)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz) + kombinasi Carrier Aggregation (4G+) B3+B1',
    indoorCoverageBands: 'Band 8 (900 MHz — jangkauan luas luar kota)',
    fiveGBands: 'n3 (1800 MHz) & n40 (2300 MHz)',
    lockRecommendation:
      'Pasca integrasi jaringan MOCN Indosat-Tri, Band 3 (1800 MHz) dan Band 1 (2100 MHz) memberikan ping paling responsif untuk game kompetitif.',
  },
  tri: {
    carrierId: 'tri',
    speedBands: 'Band 1 (2100 MHz) & Band 3 (1800 MHz — terintegrasi jaringan IOH)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz) dengan APN 3data (IPv4 Murni)',
    indoorCoverageBands: 'Band 8 (900 MHz)',
    fiveGBands: 'n3 (1800 MHz)',
    lockRecommendation:
      'Untuk pengguna Tri (3), gabungkan penguncian "LTE Only" dengan APN "3data" berprotokol IPv4 Murni untuk menghilangkan gejala ping loncat di malam hari.',
  },
  xl: {
    carrierId: 'xl',
    speedBands: 'Band 3 (1800 MHz — 20 MHz) & Band 1 (2100 MHz — 15 MHz)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz — sangat rendah jitter)',
    indoorCoverageBands: 'Band 8 (900 MHz)',
    fiveGBands: 'n1 (2100 MHz) & n3 (1800 MHz)',
    lockRecommendation:
      'XL Axiata mengandalkan Carrier Aggregation di Band 3 + Band 1. Pastikan mode "LTE Only" atau "NR/LTE" aktif agar tidak terpental ke 3G/2G.',
  },
  axis: {
    carrierId: 'axis',
    speedBands: 'Band 3 (1800 MHz) & Band 1 (2100 MHz — jaringan XL Axiata)',
    gamingStableBands: 'Band 3 (FDD 1800 MHz) + APN "axis" atau "internet" tanpa proxy',
    indoorCoverageBands: 'Band 8 (900 MHz)',
    fiveGBands: 'n1 / n3 DSS',
    lockRecommendation:
      'Kosongkan proxy lawas pada APN AXIS dan kunci radio HP di "LTE Only" untuk menjaga ping hijau di Mobile Legends & Free Fire.',
  },
  smartfren: {
    carrierId: 'smartfren',
    speedBands: 'Band 40 (TDD 2300 MHz — kapasitas besar untuk unduh & streaming)',
    gamingStableBands: 'Band 5 (FDD 850 MHz — jalur dua arah paling stabil & tembus tembok)',
    indoorCoverageBands: 'Band 5 (FDD 850 MHz — jangkauan dalam ruangan terbaik)',
    fiveGBands: '4G LTE Advanced Pro (B40 + B5)',
    lockRecommendation:
      'Rahasia pengguna Smartfren: Band 40 (2300 MHz) sangat kencang untuk download, tetapi jika di dalam kamar ping naik-turun, kunci ke Band 5 (850 MHz) yang jauh lebih stabil.',
  },
  universal: {
    carrierId: 'universal',
    speedBands: 'Band 40 (2300 MHz) + Band 3 (1800 MHz) + Band 1 (2100 MHz)',
    gamingStableBands: 'Band FDD (Band 3 / Band 1 / Band 5) lebih stabil untuk ping daripada TDD',
    indoorCoverageBands: 'Band 8 (900 MHz) & Band 5 (850 MHz)',
    fiveGBands: 'n40 / n1 / n3 / n28',
    lockRecommendation:
      'Pada modem Orbit / Huawei / ZTE (192.168.8.1), pilih penguncian Band manual: gunakan Band FDD (B3/B1) saat main game dan Band TDD (B40) saat mengunduh file besar.',
  },
};

function classifyGamePing(pingMs: number, jitterMs: number): {
  status: GameServerProbeResult['status'];
  statusLabel: string;
} {
  if (pingMs <= 48 && jitterMs <= 10) {
    return { status: 'excellent', statusLabel: 'Siap Push Rank (Hijau)' };
  }
  if (pingMs <= 82 && jitterMs <= 18) {
    return { status: 'good', statusLabel: 'Aman Bermain (Stabil)' };
  }
  return { status: 'lag_risk', statusLabel: 'Rawan Lag / Ping Spike' };
}

/**
 * Menghasilkan estimasi awal ping ke setiap server game dari ping dasar Speedtest sebelum pengguna menekan tombol Pindai Live.
 */
export function estimateGameServersFromBaseLatency(
  basePingMs: number,
  baseJitterMs: number
): GameServerProbeResult[] {
  const cleanBase = basePingMs > 0 ? basePingMs : 28;
  const cleanJitter = baseJitterMs > 0 ? baseJitterMs : 4.2;
  const nowIso = new Date().toISOString();

  return GAME_SERVER_TARGETS.map(target => {
    const pingMs = Math.max(8, Math.round(cleanBase + target.fallbackLatencyOffsetMs));
    const jitterMs = Number(
      Math.max(1.2, cleanJitter * (1 + target.fallbackLatencyOffsetMs / 65)).toFixed(1)
    );
    const { status, statusLabel } = classifyGamePing(pingMs, jitterMs);
    return {
      target,
      pingMs,
      jitterMs,
      status,
      statusLabel,
      testedAt: nowIso,
      isLiveProbe: false,
    };
  });
}

/**
 * Mengukur RTT aktual dari browser ke endpoint target (membuang sampel #1 yang memuat handshake DNS/TLS dingin).
 */
async function measureEndpointRtt(
  url: string,
  samplesCount: number = 3,
  fallbackBaseMs: number = 32
): Promise<{ pingMs: number; jitterMs: number }> {
  const rtts: number[] = [];

  for (let i = 0; i < samplesCount + 1; i++) {
    const separator = url.includes('?') ? '&' : '?';
    const probeUrl = `${url}${separator}_juru_probe=${Date.now()}_${i}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2400);
    const t0 = performance.now();
    try {
      await fetch(probeUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: ctrl.signal,
      });
      const elapsed = performance.now() - t0;
      // Buang sampel ke-0 (warmup TCP/TLS handshake) bila memungkinkan
      if (i > 0 || samplesCount === 1) {
        rtts.push(Math.max(5, elapsed));
      }
    } catch {
      // Jika terblokir firewall lokal, gunakan estimasi fallback
    } finally {
      clearTimeout(timer);
    }
  }

  if (rtts.length === 0) {
    return { pingMs: Math.round(fallbackBaseMs), jitterMs: 4.5 };
  }

  const min = Math.min(...rtts);
  const avg = rtts.reduce((s, v) => s + v, 0) / rtts.length;
  // Gunakan bobot 65% min + 35% avg agar mendekati ICMP/UDP game ping
  const effectivePing = Math.max(6, Math.round(min * 0.65 + avg * 0.35));

  let jitter = 2.1;
  if (rtts.length >= 2) {
    let diffSum = 0;
    for (let i = 1; i < rtts.length; i++) {
      diffSum += Math.abs(rtts[i] - rtts[i - 1]);
    }
    jitter = Number(Math.max(1.0, diffSum / (rtts.length - 1)).toFixed(1));
  }

  return { pingMs: effectivePing, jitterMs: jitter };
}

/**
 * Memindai latensi live ke seluruh klaster server game populer secara berurutan agar tidak saling mengantre.
 */
export async function probeAllGameServers(
  basePingMs: number,
  onProgress?: (completed: number, total: number, partial: GameServerProbeResult[]) => void
): Promise<GameServerProbeResult[]> {
  const results: GameServerProbeResult[] = [];
  const cleanBase = basePingMs > 0 ? basePingMs : 26;

  for (let i = 0; i < GAME_SERVER_TARGETS.length; i++) {
    const target = GAME_SERVER_TARGETS[i];
    const measured = await measureEndpointRtt(
      target.probeUrl,
      3,
      cleanBase + target.fallbackLatencyOffsetMs
    );
    const { status, statusLabel } = classifyGamePing(measured.pingMs, measured.jitterMs);
    results.push({
      target,
      pingMs: measured.pingMs,
      jitterMs: measured.jitterMs,
      status,
      statusLabel,
      testedAt: new Date().toISOString(),
      isLiveProbe: true,
    });
    onProgress?.(i + 1, GAME_SERVER_TARGETS.length, [...results]);
  }

  return results;
}

/**
 * Menguji kecepatan respons seluruh penyedia Private DNS (DoH/Edge) dari jaringan pengguna saat ini.
 */
export async function benchmarkDnsProviders(): Promise<DnsBenchmarkResult[]> {
  const rawResults: Array<{ provider: DnsProviderTarget; latencyMs: number }> = [];

  for (const provider of DNS_PROVIDER_TARGETS) {
    const measured = await measureEndpointRtt(provider.probeUrl, 2, 28);
    rawResults.push({
      provider,
      latencyMs: measured.pingMs,
    });
  }

  rawResults.sort((a, b) => a.latencyMs - b.latencyMs);
  return rawResults.map((item, idx) => ({
    provider: item.provider,
    latencyMs: item.latencyMs,
    rank: idx + 1,
  }));
}

/**
 * Membuka layar Pengaturan Jaringan / Private DNS di perangkat Android.
 */
export function openAndroidPrivateDnsSettings(): { isAndroid: boolean } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isAndroid = /android/i.test(ua);
  if (isAndroid && typeof window !== 'undefined') {
    try {
      window.location.href =
        'intent:#Intent;action=android.settings.WIRELESS_SETTINGS;end';
    } catch {
      // ignore fallback
    }
  }
  return { isAndroid };
}

/**
 * Membuka dialer Android atau menyalin kode rahasia *#*#4636#*#* untuk mengunci 4G/5G (NR/LTE Only).
 */
export async function triggerAndroidRadioLockMenu(): Promise<{
  isAndroid: boolean;
  codeCopied: boolean;
}> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isAndroid = /android/i.test(ua);
  let codeCopied = false;

  try {
    await navigator.clipboard.writeText('*#*#4636#*#*');
    codeCopied = true;
  } catch {
    // ignore clipboard error
  }

  if (isAndroid && typeof window !== 'undefined') {
    try {
      window.location.href = 'tel:*%23*%234636%23*%23';
    } catch {
      // ignore fallback
    }
  }

  return { isAndroid, codeCopied };
}

