import type {
  ActivityRating,
  BufferbloatGrade,
  FupAnalysis,
  LatencyMetrics,
  NetworkDiagnosis,
  SpeedSample,
  SpeedUnit,
  SpeedtestHistoryEntry,
  TestProfile,
  TestProfileId,
} from '../types/speedtest';

export const TEST_PROFILES: Record<TestProfileId, TestProfile> = {
  quick: {
    id: 'quick',
    label: 'Cepat',
    description: 'Hemat kuota (~5 dtk per fase)',
    pingSamples: 10,
    downloadDurationMs: 5200,
    uploadDurationMs: 5200,
    parallelStreams: 3,
  },
  standard: {
    id: 'standard',
    label: 'Standar',
    description: 'Seimbang & akurat (~8 dtk per fase)',
    pingSamples: 16,
    downloadDurationMs: 8000,
    uploadDurationMs: 8000,
    parallelStreams: 4,
  },
  precision: {
    id: 'precision',
    label: 'Presisi',
    description: 'Beban penuh Fiber/5G (~12 dtk per fase)',
    pingSamples: 22,
    downloadDurationMs: 12000,
    uploadDurationMs: 11000,
    parallelStreams: 6,
  },
};

export const COLO_CITY_MAP: Record<string, string> = {
  CGK: 'Jakarta, ID',
  SUB: 'Surabaya, ID',
  JOG: 'Yogyakarta, ID',
  DPS: 'Denpasar (Bali), ID',
  MES: 'Medan, ID',
  UPG: 'Makassar, ID',
  BPN: 'Balikpapan, ID',
  PLM: 'Palembang, ID',
  PKU: 'Pekanbaru, ID',
  BDO: 'Bandung, ID',
  SRG: 'Semarang, ID',
  BTH: 'Batam, ID',
  PNK: 'Pontianak, ID',
  MDC: 'Manado, ID',
  SOC: 'Surakarta (Solo), ID',
  MLG: 'Malang, ID',
  LOP: 'Lombok, ID',
  BDJ: 'Banjarmasin, ID',
  PDG: 'Padang, ID',
  TKG: 'Bandar Lampung, ID',
  SIN: 'Singapura, SG',
  KUL: 'Kuala Lumpur, MY',
  BKK: 'Bangkok, TH',
  MNL: 'Manila, PH',
  HKG: 'Hong Kong, HK',
  TPE: 'Taipei, TW',
  NRT: 'Tokyo, JP',
  ICN: 'Seoul, KR',
  SYD: 'Sydney, AU',
  MEL: 'Melbourne, AU',
  PER: 'Perth, AU',
  LAX: 'Los Angeles, US',
  SJC: 'San Jose, US',
  SEA: 'Seattle, US',
  FRA: 'Frankfurt, DE',
  AMS: 'Amsterdam, NL',
  LHR: 'London, GB',
};

export const ASN_ISP_MAP: Record<string, string> = {
  // Seluler Indonesia
  '23693': 'Telkomsel (Seluler / by.U / Orbit)',
  '4761': 'Indosat Ooredoo Hutchison (IM3)',
  '55699': 'Tri Indonesia (3 / IOH)',
  '24203': 'XL Axiata / AXIS',
  '45147': 'Smartfren Telecom 4G/5G',
  '133809': 'Smartfren Telecom',
  // Fixed Broadband / Wi-Fi / Fiber Indonesia
  '7713': 'Telkom Indonesia (IndiHome)',
  '17974': 'Telkom Indonesia (Astinet / IndiHome)',
  '17451': 'Biznet Networks',
  '23700': 'First Media (LinkNet)',
  '45727': 'MyRepublic Indonesia',
  '136107': 'CBN Fiber',
  '138840': 'Oxygen.id (Moratelindo)',
  '23947': 'Moratelindo',
  '55685': 'MNC Play (Asianet)',
  '131757': 'ICONNET (PLN Icon Plus)',
  '131774': 'Megavision',
  '18004': 'CitraNet',
  '58495': 'Bali Fiber',
  '38758': 'Hypernet Indodata',
  '4800': 'Lintasarta',
  '9340': 'Indonet',
  '55666': 'XL Home Fiber',
  '136052': 'IDCloudHost / Lokal ISP',
  '14593': 'Starlink SpaceX Indonesia',
};

export const INDONESIAN_CELLULAR_ASNS = new Set([
  '23693',
  '4761',
  '55699',
  '24203',
  '45147',
  '133809',
]);

export function resolveColoCity(coloCode: string): string {
  const upper = (coloCode || '').trim().toUpperCase();
  if (!upper) return 'Edge Global';
  return COLO_CITY_MAP[upper] || `Edge ${upper}`;
}

export function convertSpeed(mbps: number, unit: SpeedUnit): number {
  if (!Number.isFinite(mbps) || mbps < 0) return 0;
  return unit === 'MB/s' ? mbps / 8 : mbps;
}

export function formatSpeed(mbps: number, unit: SpeedUnit = 'Mbps'): string {
  const val = convertSpeed(mbps, unit);
  if (val >= 100) return val.toFixed(1);
  if (val >= 10) return val.toFixed(2);
  return val.toFixed(2);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export function maskIpAddress(ip: string): string {
  if (!ip || ip === '—') return '—';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 2).join(':')}:••••:••••`;
  }
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.•••.•••`;
  }
  return '•••.•••.•••.•••';
}

export function evaluateBufferbloat(latency: LatencyMetrics): {
  grade: BufferbloatGrade;
  deltaMs: number;
  label: string;
} {
  const base = latency.unloadedMs || 0;
  const loadedCandidates = [latency.downloadLoadedMs, latency.uploadLoadedMs].filter(
    (v): v is number => typeof v === 'number' && v > 0
  );

  if (base <= 0 || loadedCandidates.length === 0) {
    return {
      grade: 'A',
      deltaMs: 0,
      label: 'Stabil di bawah beban',
    };
  }

  const avgLoaded =
    loadedCandidates.reduce((sum, val) => sum + val, 0) / loadedCandidates.length;
  const deltaMs = Math.max(0, Math.round(avgLoaded - base));

  if (deltaMs <= 10) {
    return { grade: 'A+', deltaMs, label: 'Sangat Stabil (Tanpa Antrean Paket)' };
  }
  if (deltaMs <= 25) {
    return { grade: 'A', deltaMs, label: 'Stabil di Bawah Beban Penuh' };
  }
  if (deltaMs <= 55) {
    return { grade: 'B', deltaMs, label: 'Lonjakan Latensi Ringan Saat Sibuk' };
  }
  if (deltaMs <= 120) {
    return { grade: 'C', deltaMs, label: 'Bufferbloat Sedang Saat Unduh/Unggah' };
  }
  if (deltaMs <= 220) {
    return { grade: 'D', deltaMs, label: 'Bufferbloat Tinggi (Rawan Lag Saat Sibuk)' };
  }
  return { grade: 'F', deltaMs, label: 'Bufferbloat Berat (Antrean Router Penuh)' };
}

function tierFromScore(score: number): ActivityRating['tier'] {
  if (score >= 85) return 'Sangat Baik';
  if (score >= 68) return 'Baik';
  if (score >= 45) return 'Cukup';
  return 'Kurang';
}

const INDONESIAN_FUP_CEILINGS_MBPS = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0];

/**
 * Detektor otomatis indikasi FUP (Fair Usage Policy), Traffic Shaping, atau Kepadatan Sektor BTS Indonesia.
 */
export function detectFupAndThrottling(
  downloadMbps: number,
  uploadMbps: number,
  latency: LatencyMetrics,
  downloadPeakMbps?: number,
  downloadSeries?: SpeedSample[]
): FupAnalysis {
  const ping = latency.unloadedMs;
  const peak = downloadPeakMbps && downloadPeakMbps > 0 ? downloadPeakMbps : downloadMbps;
  const peakToAvgRatio = downloadMbps > 0 ? peak / downloadMbps : 1;

  // Hitung koefisien variasi pada paruh kedua sampel unduh (setelah TCP slow-start)
  let isFlatlineSeries = peakToAvgRatio <= 1.18;
  if (downloadSeries && downloadSeries.length >= 6) {
    const tail = downloadSeries.slice(Math.floor(downloadSeries.length / 3));
    const mean = tail.reduce((s, x) => s + x.mbps, 0) / tail.length;
    if (mean > 0) {
      const variance =
        tail.reduce((s, x) => s + Math.pow(x.mbps - mean, 2), 0) / tail.length;
      const cv = Math.sqrt(variance) / mean;
      if (cv <= 0.085) isFlatlineSeries = true;
    }
  }

  // Cek apakah dekat dengan batas patokan FUP populer di Indonesia (0.5, 1, 1.5, 2, 3, 5, 10 Mbps)
  const matchedCeiling = INDONESIAN_FUP_CEILINGS_MBPS.find(
    cap => Math.abs(downloadMbps - cap) <= Math.max(0.18, cap * 0.1)
  );

  if (matchedCeiling && downloadMbps <= 10.6 && isFlatlineSeries && ping > 0 && ping <= 85) {
    return {
      isSuspectedFup: true,
      detectedCeilingMbps: matchedCeiling,
      confidence: peakToAvgRatio <= 1.12 ? 'tinggi' : 'sedang',
      headline: `Terindikasi Batas FUP / Pembatasan Operator (~${matchedCeiling} Mbps)`,
      detail: `Kecepatan unduh tertahan rata di kisaran ${downloadMbps.toFixed(
        2
      )} Mbps (puncak ${peak.toFixed(
        2
      )} Mbps) padahal ping dasar masih responsif (${Math.round(
        ping
      )} ms). Pola "flatline" ini khas kebijakan FUP (Fair Usage Policy) paket Unlimited atau pembatasan trafik ISP.`,
      remedy:
        'Coba ganti ke Rekomendasi APN Tercepat (jalur GGSN alternatif tanpa proxy) atau aktifkan Private DNS di bawah untuk melewati pembatasan rute standar.',
    };
  }

  // Kondisi 2: Upload jauh lebih kencang daripada Download (Kepadatan BTS Seluler 4G di jam sibuk)
  if (uploadMbps > downloadMbps * 1.45 && downloadMbps < 12 && uploadMbps >= 3) {
    return {
      isSuspectedFup: true,
      detectedCeilingMbps: null,
      confidence: 'tinggi',
      headline: 'Terdeteksi Kepadatan Sektor BTS (Upload > Download)',
      detail: `Kecepatan unggah (${uploadMbps.toFixed(
        1
      )} Mbps) jauh lebih tinggi dibanding unduh (${downloadMbps.toFixed(
        1
      )} Mbps). Ini menandakan pita frekuensi (LTE Band) unduhan di menara BTS sekitar Anda sedang penuh oleh pengguna lain.`,
      remedy:
        'Gunakan panel Pengunci 4G/5G & Band LTE di bawah untuk berpindah pita frekuensi (mis. Band 40 / 2300 MHz atau Band 1 / 2100 MHz) dan pakai APN alternatif.',
    };
  }

  return {
    isSuspectedFup: false,
    detectedCeilingMbps: null,
    confidence: 'normal',
    headline: 'Jalur Bandwidth Bebas FUP / Tanpa Pembatasan',
    detail:
      'Tidak ditemukan pola pemangkasan kecepatan buatan (FUP cap) pada kurva throughput Anda.',
    remedy:
      'Pertahankan profil APN & DNS yang sedang aktif untuk menjaga konsistensi throughput.',
  };
}

export function diagnoseNetwork(
  downloadMbps: number,
  uploadMbps: number,
  latency: LatencyMetrics,
  downloadPeakMbps?: number,
  downloadSeries?: SpeedSample[]
): NetworkDiagnosis {
  const ping = latency.unloadedMs;
  const jitter = latency.jitterMs;
  const loss = latency.packetLossPct;
  const bloat = evaluateBufferbloat(latency);
  const fupAnalysis = detectFupAndThrottling(
    downloadMbps,
    uploadMbps,
    latency,
    downloadPeakMbps,
    downloadSeries
  );

  // 1. Streaming 4K / UHD
  let streamScore = 0;
  if (downloadMbps >= 50) streamScore = 98;
  else if (downloadMbps >= 25) streamScore = 88;
  else if (downloadMbps >= 10) streamScore = 72;
  else if (downloadMbps >= 5) streamScore = 52;
  else streamScore = Math.max(15, Math.round((downloadMbps / 5) * 45));
  if (loss > 2) streamScore -= Math.min(25, Math.round(loss * 4));
  streamScore = Math.max(5, Math.min(100, streamScore));

  const streamDetail =
    downloadMbps >= 25
      ? 'Lancar untuk multi-perangkat 4K HDR tanpa buffering.'
      : downloadMbps >= 10
      ? 'Lancar untuk Full HD 1080p; 4K mungkin butuh buffering awal.'
      : downloadMbps >= 5
      ? 'Cukup untuk HD 720p pada satu layar.'
      : 'Disarankan resolusi 480p untuk menghindari jeda.';

  // 2. Competitive Gaming
  let gameScore = 100;
  if (ping > 120) gameScore -= 55;
  else if (ping > 80) gameScore -= 35;
  else if (ping > 45) gameScore -= 16;
  else if (ping > 25) gameScore -= 6;

  if (jitter > 25) gameScore -= 30;
  else if (jitter > 12) gameScore -= 15;
  else if (jitter > 5) gameScore -= 5;

  if (loss > 0) gameScore -= Math.min(40, Math.round(loss * 12));
  if (bloat.deltaMs > 100) gameScore -= 15;
  else if (bloat.deltaMs > 50) gameScore -= 7;
  if (downloadMbps < 3 || uploadMbps < 1) gameScore -= 20;
  gameScore = Math.max(5, Math.min(100, gameScore));

  const gameDetail =
    gameScore >= 85
      ? `Ping ${Math.round(ping)} ms & jitter ±${jitter.toFixed(1)} ms, sangat responsif untuk Mobile Legends, PUBG, FF & Valorant.`
      : gameScore >= 68
      ? 'Stabil untuk game online umum; hindari unduhan besar saat bermain.'
      : gameScore >= 45
      ? 'Masih dapat dimainkan namun berpotensi ping kuning/merah saat jam sibuk.'
      : 'Latensi/jitter tinggi menyebabkan jeda input yang terasa saat war.';

  // 3. Video Call / Zoom / Sidang e-Court HD
  let callScore = 95;
  if (uploadMbps < 1.5) callScore -= 50;
  else if (uploadMbps < 3.5) callScore -= 24;
  else if (uploadMbps < 8) callScore -= 8;

  if (downloadMbps < 3) callScore -= 35;
  else if (downloadMbps < 8) callScore -= 12;

  if (jitter > 25) callScore -= 25;
  else if (jitter > 12) callScore -= 10;
  if (ping > 150) callScore -= 20;
  if (loss > 1) callScore -= Math.min(30, Math.round(loss * 8));
  if (bloat.deltaMs > 120) callScore -= 12;
  callScore = Math.max(5, Math.min(100, callScore));

  const callDetail =
    callScore >= 85
      ? 'Suara & kamera HD jernih stabil untuk Zoom, Meet, & sidang online.'
      : callScore >= 68
      ? 'Lancar untuk rapat HD; matikan sinkronisasi cloud besar saat presentasi.'
      : callScore >= 45
      ? 'Cukup untuk panggilan standar; matikan kamera HD jika suara mulai putus.'
      : 'Kecepatan unggah atau kestabilan kurang untuk video dua arah.';

  // 4. Cloud Work & Large File Upload
  let cloudScore = 0;
  if (uploadMbps >= 50 && downloadMbps >= 50) cloudScore = 98;
  else if (uploadMbps >= 20 && downloadMbps >= 30) cloudScore = 88;
  else if (uploadMbps >= 10 && downloadMbps >= 15) cloudScore = 76;
  else if (uploadMbps >= 4 && downloadMbps >= 8) cloudScore = 58;
  else cloudScore = Math.max(15, Math.round(Math.min(uploadMbps * 8, 44)));
  cloudScore = Math.max(5, Math.min(100, cloudScore));

  const upload100MbSec = uploadMbps > 0 ? Math.max(1, Math.round((100 * 8) / uploadMbps)) : 999;
  const cloudDetail =
    uploadMbps > 0
      ? `Estimasi unggah berkas 100 MB sekitar ~${
          upload100MbSec >= 60
            ? `${Math.floor(upload100MbSec / 60)}m ${upload100MbSec % 60}d`
            : `${upload100MbSec} detik`
        }.`
      : 'Menunggu hasil pengujian unggah.';

  const overallScore = Math.round(
    streamScore * 0.28 + gameScore * 0.24 + callScore * 0.28 + cloudScore * 0.2
  );

  let headline = 'Koneksi Sangat Prima';
  if (overallScore >= 88) headline = 'Koneksi Kelas Fiber / 5G Sangat Prima';
  else if (overallScore >= 72) headline = 'Koneksi Cepat & Stabil';
  else if (overallScore >= 52) headline = 'Koneksi Memadai untuk Harian';
  else headline = 'Koneksi Terbatas / Perlu Optimasi APN';

  const summaryParts: string[] = [];
  summaryParts.push(
    `Kecepatan unduh ${downloadMbps.toFixed(1)} Mbps dan unggah ${uploadMbps.toFixed(1)} Mbps dengan ping dasar ${Math.round(ping)} ms.`
  );
  if (bloat.deltaMs <= 25) {
    summaryParts.push(
      `Manajemen antrean jaringan sangat baik (Bufferbloat ${bloat.grade}, hanya +${bloat.deltaMs} ms saat jalur penuh).`
    );
  } else if (bloat.deltaMs <= 90) {
    summaryParts.push(
      `Terdapat kenaikan latensi moderat (+${bloat.deltaMs} ms) ketika jaringan dipakai mengunduh penuh.`
    );
  } else {
    summaryParts.push(
      `Terdeteksi lonjakan latensi +${bloat.deltaMs} ms saat beban penuh (Bufferbloat ${bloat.grade}) yang dapat memicu lag ketika ada unduhan berjalan.`
    );
  }

  const tips: string[] = [];
  if (fupAnalysis.isSuspectedFup) {
    tips.push(`${fupAnalysis.headline}: ${fupAnalysis.remedy}`);
  }
  if (jitter > 10 || ping > 55) {
    tips.push(
      'Untuk main game kompetitif tanpa lag, pilih Rekomendasi APN Terstabil (Protokol IPv4 Murni & Bearer LTE) pada panel Optimasi APN di atas.'
    );
  }
  if (downloadMbps < 20) {
    tips.push(
      'Untuk mempercepat unduhan & streaming, pilih Rekomendasi APN Tercepat (Dual-Stack IPv4/IPv6 tanpa proxy) pada panel Optimasi APN.'
    );
  }
  if (bloat.deltaMs > 60) {
    tips.push(
      'Jika menggunakan Wi-Fi router rumah, aktifkan fitur QoS / SQM agar video call & game tetap mulus saat ada unduhan besar.'
    );
  }
  if (tips.length === 0) {
    tips.push(
      'Jaringan berada dalam kondisi optimal. Simpan hasil uji ini sebagai patokan (baseline) performa kartu/ISP Anda.'
    );
  }

  return {
    overallScore,
    gamingScore: gameScore,
    headline,
    summary: summaryParts.join(' '),
    bufferbloatGrade: bloat.grade,
    bufferbloatDeltaMs: bloat.deltaMs,
    bufferbloatLabel: bloat.label,
    fupAnalysis,
    tips,
    activities: [
      {
        id: 'streaming',
        title: 'Streaming 4K UHD',
        subtitle: 'Netflix, YouTube, Live Bola',
        score: streamScore,
        tier: tierFromScore(streamScore),
        detail: streamDetail,
      },
      {
        id: 'gaming',
        title: 'Gaming Kompetitif',
        subtitle: 'MLBB, PUBG, FF, Valorant',
        score: gameScore,
        tier: tierFromScore(gameScore),
        detail: gameDetail,
      },
      {
        id: 'videocall',
        title: 'Video Call & Rapat HD',
        subtitle: 'Zoom, Meet, WhatsApp Call',
        score: callScore,
        tier: tierFromScore(callScore),
        detail: callDetail,
      },
      {
        id: 'cloud',
        title: 'Kerja Cloud & Berkas',
        subtitle: 'Drive, Upload Konten, Hotspot',
        score: cloudScore,
        tier: tierFromScore(cloudScore),
        detail: cloudDetail,
      },
    ],
  };
}

/**
 * Generates a crisp PNG telemetry card via Canvas 2D and triggers browser download.
 */
export function downloadResultCardPng(
  entry: SpeedtestHistoryEntry,
  maskIp: boolean
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, '#070B14');
  bg.addColorStop(0.55, '#0B1324');
  bg.addColorStop(1, '#081C24');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 675);

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 675);
    ctx.stroke();
  }
  for (let y = 0; y <= 675; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(44, 40, 1112, 595, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0D9488';
  ctx.beginPath();
  ctx.roundRect(84, 76, 52, 52, 14);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('JS', 96, 110);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 30px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('JuruSpeedtest', 152, 104);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  ctx.fillText('Sertifikat Hasil Uji Kecepatan & Optimasi APN Indonesia', 152, 128);

  const formattedDate = new Date(entry.timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formattedDate, 1110, 98);

  ctx.fillStyle = '#2DD4BF';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText(
    `Skor Jaringan: ${entry.overallScore}/100  •  Bufferbloat ${entry.bufferbloatGrade}`,
    1110,
    126
  );
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(13, 148, 136, 0.12)';
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
  ctx.beginPath();
  ctx.roundRect(84, 168, 500, 220, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5EEAD4';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText('DOWNLOAD (UNDUH)', 116, 212);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 84px "JetBrains Mono", monospace';
  ctx.fillText(entry.downloadMbps.toFixed(2), 116, 308);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  ctx.fillText(
    `Mbps   •   Puncak ${entry.downloadPeakMbps.toFixed(1)} Mbps`,
    116,
    354
  );

  ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.beginPath();
  ctx.roundRect(616, 168, 500, 220, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#7DD3FC';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText('UPLOAD (UNGGAH)', 648, 212);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 84px "JetBrains Mono", monospace';
  ctx.fillText(entry.uploadMbps.toFixed(2), 648, 308);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  ctx.fillText(
    `Mbps   •   Puncak ${entry.uploadPeakMbps.toFixed(1)} Mbps`,
    648,
    354
  );

  const metricBoxes = [
    { label: 'PING TANPA BEBAN', value: `${Math.round(entry.pingMs)} ms` },
    { label: 'JITTER', value: `${entry.jitterMs.toFixed(1)} ms` },
    { label: 'PACKET LOSS', value: `${entry.packetLossPct.toFixed(1)}%` },
    {
      label: 'SKOR GAMING',
      value: `${entry.gamingScore ?? entry.overallScore}/100`,
    },
  ];

  metricBoxes.forEach((m, idx) => {
    const bx = 84 + idx * 262;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, 414, 244, 104, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText(m.label, bx + 22, 448);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillText(m.value, bx + 22, 494);
  });

  const shownIp = maskIp ? maskIpAddress(entry.ip) : entry.ip;
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 18px Inter, system-ui, sans-serif';
  ctx.fillText(
    `ISP: ${entry.isp}   •   IP: ${shownIp}   •   Lokasi: ${entry.city}`,
    84,
    576
  );

  ctx.fillStyle = '#64748B';
  ctx.font = '500 15px Inter, system-ui, sans-serif';
  const apnSuffix = entry.apnValue ? `   •   APN: ${entry.apnValue}` : '';
  ctx.fillText(
    `Server Edge: Cloudflare ${entry.coloCode} (${entry.coloCity})${apnSuffix}   •   Juru Speedtest Indonesia`,
    84,
    604
  );

  const link = document.createElement('a');
  const stamp = new Date(entry.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `juru-speedtest-${stamp}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates a Before-vs-After APN Optimization Comparison PNG Certificate (1200x675).
 */
export function downloadBeforeAfterCardPng(
  before: SpeedtestHistoryEntry,
  after: SpeedtestHistoryEntry,
  maskIp: boolean
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, '#070B14');
  bg.addColorStop(0.5, '#0A1628');
  bg.addColorStop(1, '#062022');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 675);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 36, 1120, 603, 28);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = '#0D9488';
  ctx.beginPath();
  ctx.roundRect(76, 68, 48, 48, 12);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('JS', 88, 99);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Bukti Perbandingan SEBELUM vs SESUDAH Optimasi APN', 140, 94);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 15px Inter, sans-serif';
  const shownIp = maskIp ? maskIpAddress(after.ip) : after.ip;
  ctx.fillText(
    `Operator/ISP: ${after.isp}  •  IP: ${shownIp}  •  Lokasi: ${after.city}`,
    140,
    118
  );

  // Left Column: SEBELUM
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
  ctx.beginPath();
  ctx.roundRect(76, 148, 496, 405, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText('KONDISI AWAL (SEBELUM)', 106, 186);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText(`APN: ${before.apnValue || 'Default Bawaan'}`, 106, 212);

  // Right Column: SESUDAH
  ctx.fillStyle = 'rgba(13, 148, 136, 0.16)';
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.55)';
  ctx.beginPath();
  ctx.roundRect(628, 148, 496, 405, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2DD4BF';
  ctx.font = '800 16px Inter, sans-serif';
  const modeLabel =
    after.chosenMode === 'gaming' ? 'SESUDAH • MODE STABIL GAME' : 'SESUDAH • MODE TERCEPAT';
  ctx.fillText(modeLabel, 658, 186);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.fillText(`APN: ${after.apnValue || 'APN Rekomendasi'} (${after.apnName || ''})`.slice(0, 48), 658, 212);

  const rows = [
    {
      label: 'Download',
      bVal: `${before.downloadMbps.toFixed(2)} Mbps`,
      aVal: `${after.downloadMbps.toFixed(2)} Mbps`,
      improved: after.downloadMbps >= before.downloadMbps,
    },
    {
      label: 'Upload',
      bVal: `${before.uploadMbps.toFixed(2)} Mbps`,
      aVal: `${after.uploadMbps.toFixed(2)} Mbps`,
      improved: after.uploadMbps >= before.uploadMbps,
    },
    {
      label: 'Ping Dasar',
      bVal: `${Math.round(before.pingMs)} ms`,
      aVal: `${Math.round(after.pingMs)} ms`,
      improved: after.pingMs <= before.pingMs,
    },
    {
      label: 'Jitter Game',
      bVal: `±${before.jitterMs.toFixed(1)} ms`,
      aVal: `±${after.jitterMs.toFixed(1)} ms`,
      improved: after.jitterMs <= before.jitterMs,
    },
    {
      label: 'Skor Gaming',
      bVal: `${before.gamingScore ?? before.overallScore}/100 (${before.bufferbloatGrade})`,
      aVal: `${after.gamingScore ?? after.overallScore}/100 (${after.bufferbloatGrade})`,
      improved: (after.gamingScore ?? after.overallScore) >= (before.gamingScore ?? before.overallScore),
    },
  ];

  rows.forEach((r, idx) => {
    const y = 264 + idx * 58;
    // Before row
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText(r.label, 106, y);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(r.bVal, 540, y);

    // After row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText(r.label, 658, y);
    ctx.fillStyle = r.improved ? '#34D399' : '#F8FAFC';
    ctx.font = '800 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(r.aVal, 1094, y);
    ctx.textAlign = 'left';
  });

  // Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText(
    `Diukur secara riil di juruspeedtest.online • ${new Date(after.timestamp).toLocaleString('id-ID')}`,
    76,
    600
  );

  // Viral badge on right footer
  ctx.fillStyle = '#2DD4BF';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Cek & Racik APN Kartumu: juruspeedtest.online', 1124, 600);
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  const stamp = new Date(after.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `juru-sebelum-sesudah-${stamp}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Menyusun naskah laporan komplain teknis berstandar NOC untuk dikirim ke CS ISP / Operator Seluler via WhatsApp atau X.
 */
export function generateIspComplaintText(
  entry: SpeedtestHistoryEntry,
  maskIp: boolean
): string {
  const shownIp = maskIp ? maskIpAddress(entry.ip) : entry.ip;
  const issues: string[] = [];

  if (entry.downloadMbps < 10) {
    issues.push(`Kecepatan unduh sangat rendah (${entry.downloadMbps.toFixed(2)} Mbps)`);
  }
  if (entry.pingMs > 65) {
    issues.push(`Latensi dasar tinggi (${Math.round(entry.pingMs)} ms)`);
  }
  if (entry.jitterMs > 12) {
    issues.push(`Jitter tidak stabil (±${entry.jitterMs.toFixed(1)} ms)`);
  }
  if (entry.packetLossPct > 0.5) {
    issues.push(`Terjadi Packet Loss (${entry.packetLossPct.toFixed(1)}%)`);
  }
  if (entry.bufferbloatGrade === 'D' || entry.bufferbloatGrade === 'F') {
    issues.push(`Bufferbloat / antrean beban berat (Grade ${entry.bufferbloatGrade})`);
  }
  if (issues.length === 0) {
    issues.push('Permintaan verifikasi kestabilan rute jaringan & kapasitas kapasitas sektor/ODP');
  }

  return [
    `Halo Tim Teknis / Layanan Pelanggan *${entry.isp}*,`,
    `Mohon bantuan pengecekan kualitas jaringan pada lokasi saya karena terdeteksi kendala teknis berikut:`,
    `• Kendala Utama: *${issues.join('; ')}*`,
    ``,
    `📋 *DATA TELEMETRI PENGUJIAN (JURU SPEEDTEST NOC)*`,
    `• Waktu Uji: ${new Date(entry.timestamp).toLocaleString('id-ID')}`,
    `• Provider / ASN: ${entry.isp}${entry.asn ? ` (${entry.asn})` : ''}`,
    `• IP Publik & Lokasi: ${shownIp} (${entry.city})`,
    `• Server Uji Edge: Cloudflare ${entry.coloCode} (${entry.coloCity})`,
    `• Download: *${entry.downloadMbps.toFixed(2)} Mbps* (Puncak ${entry.downloadPeakMbps.toFixed(2)} Mbps)`,
    `• Upload: *${entry.uploadMbps.toFixed(2)} Mbps* (Puncak ${entry.uploadPeakMbps.toFixed(2)} Mbps)`,
    `• Ping Idle: *${Math.round(entry.pingMs)} ms* | Jitter: *±${entry.jitterMs.toFixed(1)} ms* | Packet Loss: *${entry.packetLossPct.toFixed(1)}%*`,
    `• Ping Saat Beban (Loaded): Unduh ${
      entry.downloadLoadedMs ? `${Math.round(entry.downloadLoadedMs)} ms` : '—'
    } / Unggah ${entry.uploadLoadedMs ? `${Math.round(entry.uploadLoadedMs)} ms` : '—'} (Bufferbloat Grade *${entry.bufferbloatGrade}*)`,
    ...(entry.apnValue ? [`• APN Aktif: ${entry.apnValue} (${entry.apnName || 'Profil Seluler'})`] : []),
    ``,
    `Mohon dilakukan *reset port/session*, pengecekan rute *routing/peering*, atau pemeriksaan kepadatan BTS/ODP di area *${entry.city}*. Terima kasih.`,
  ].join('\n');
}

/**
 * Menyusun tautan Share WhatsApp untuk bukti Sebelum vs Sesudah sekaligus membuka +1 Kuota Uji Gratis.
 */
export function buildViralShareWhatsAppUrl(
  before: SpeedtestHistoryEntry | null,
  after: SpeedtestHistoryEntry | null
): string {
  const lines =
    before && after
      ? [
          `🚀 *Hasil Optimasi Jaringan & APN Kartu Saya di Juru Speedtest!*`,
          `• Operator/ISP: *${after.isp}* (${after.city})`,
          `• SEBELUM: Download *${before.downloadMbps.toFixed(1)} Mbps* | Ping *${Math.round(before.pingMs)} ms* (Jitter ±${before.jitterMs.toFixed(1)} ms)`,
          `• SESUDAH (${after.chosenMode === 'gaming' ? 'APN Stabil Game' : 'APN Tercepat'} - \`${
            after.apnValue || 'internet'
          }\`): Download *${after.downloadMbps.toFixed(1)} Mbps* | Ping *${Math.round(
            after.pingMs
          )} ms* (Jitter ±${after.jitterMs.toFixed(1)} ms)`,
          `• Skor Game: *${after.gamingScore ?? after.overallScore}/100* (Bufferbloat Grade ${after.bufferbloatGrade})`,
          ``,
          `Coba 9x gratis tes Sebelum vs Sesudah & racik APN semua kartu Indonesia (Telkomsel, by.U, IM3, Tri, XL, AXIS, Smartfren) di:`,
          `👉 https://juruspeedtest.online`,
        ]
      : [
          `🚀 *Cek Kecepatan Internet, Ping Server Game & Racik APN Tercepat Indonesia!*`,
          `Bandingkan Sebelum vs Sesudah ganti APN untuk semua kartu (Telkomsel, by.U, Indosat IM3, Tri, XL, AXIS, Smartfren) supaya download kencang & main game bebas lag:`,
          `👉 https://juruspeedtest.online`,
        ];

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}
