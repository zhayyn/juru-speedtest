import type {
  ApnBenchmarkStats,
  ApnFocusTag,
  ApnProfile,
  CarrierId,
  NetworkMeta,
  SpeedtestHistoryEntry,
} from '../types/speedtest';

export interface CarrierInfo {
  id: CarrierId;
  name: string;
  shortName: string;
  subBrands: string;
  mccMnc: string;
  networkGeneration: string;
  accentClass: string;
  defaultApnCode: string;
}

export const CARRIER_CATALOG: Record<CarrierId, CarrierInfo> = {
  telkomsel: {
    id: 'telkomsel',
    name: 'Telkomsel',
    shortName: 'Telkomsel',
    subBrands: 'PraBayar, Simpati, Halo, Orbit',
    mccMnc: '510-10',
    networkGeneration: '4G+ LTE-A & 5G NR',
    accentClass: 'text-rose-500',
    defaultApnCode: 'internet',
  },
  byu: {
    id: 'byu',
    name: 'by.U Digital (Telkomsel)',
    shortName: 'by.U',
    subBrands: 'Kartu Digital by.U, Kuota Topping & Kaget',
    mccMnc: '510-10',
    networkGeneration: '4G+ LTE-A & 5G Telkomsel',
    accentClass: 'text-cyan-500',
    defaultApnCode: 'byu',
  },
  indosat: {
    id: 'indosat',
    name: 'Indosat Ooredoo Hutchison (IM3)',
    shortName: 'Indosat IM3',
    subBrands: 'IM3 Prabayar, Platinum, Mentari, HiFi Air',
    mccMnc: '510-01 / 510-21',
    networkGeneration: '4G+ MOCN IOH & 5G',
    accentClass: 'text-amber-500',
    defaultApnCode: 'indosatgprs',
  },
  tri: {
    id: 'tri',
    name: 'Tri Indonesia (3)',
    shortName: 'Tri (3)',
    subBrands: 'AlwaysOn (AON), Happy, H3RO Gaming (Jaringan IOH)',
    mccMnc: '510-89',
    networkGeneration: '4G+ MOCN IOH & 5G',
    accentClass: 'text-fuchsia-500',
    defaultApnCode: '3data',
  },
  xl: {
    id: 'xl',
    name: 'XL Axiata',
    shortName: 'XL Axiata',
    subBrands: 'XL Prabayar, PRIORITAS, XL SATU, Live.On',
    mccMnc: '510-11',
    networkGeneration: '4G+ LTE-A & 5G',
    accentClass: 'text-blue-500',
    defaultApnCode: 'internet',
  },
  axis: {
    id: 'axis',
    name: 'AXIS (Jaringan XL Axiata)',
    shortName: 'AXIS',
    subBrands: 'Bronet, Warnet Unlimited, OWSEM Game, Suka-Suka',
    mccMnc: '510-08 / 510-11',
    networkGeneration: '4G+ LTE-A XL Axiata',
    accentClass: 'text-violet-500',
    defaultApnCode: 'AXIS',
  },
  smartfren: {
    id: 'smartfren',
    name: 'Smartfren Telecom',
    shortName: 'Smartfren',
    subBrands: 'Unlimited Nonstop, Gokil Max, Kuota, Connex, 1ON+',
    mccMnc: '510-09 / 510-28',
    networkGeneration: '100% 4G LTE + VoLTE & 5G',
    accentClass: 'text-pink-500',
    defaultApnCode: 'smartfren4g',
  },
  universal: {
    id: 'universal',
    name: 'Modem Router / Roaming / ISP Lainnya',
    shortName: 'Modem / Lainnya',
    subBrands: 'Modem 4G/5G Huawei/ZTE, Orbit, HiFi, eSIM Travel',
    mccMnc: 'Multi-Operator',
    networkGeneration: '4G / 5G / Fixed Wireless',
    accentClass: 'text-teal-500',
    defaultApnCode: 'internet',
  },
};

export function normalizeCarrierId(raw: unknown): CarrierId {
  if (raw === 'xl_axis') return 'xl';
  if (
    raw === 'telkomsel' ||
    raw === 'byu' ||
    raw === 'indosat' ||
    raw === 'tri' ||
    raw === 'xl' ||
    raw === 'axis' ||
    raw === 'smartfren' ||
    raw === 'universal'
  ) {
    return raw;
  }
  return 'telkomsel';
}

export const PRESET_APN_PROFILES: ApnProfile[] = [
  // ================= TELKOMSEL =================
  {
    id: 'tsel-internet-dual',
    carrierId: 'telkomsel',
    name: 'Telkomsel Default Turbo (4G+/5G Dual-Stack)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '10',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 95,
    estimatedStabilityScore: 85,
    summary:
      'Jalur utama resmi Telkomsel tanpa proxy dengan dukungan penuh Dual-Stack IPv4/IPv6 untuk memaksimalkan Carrier Aggregation 4G+ & 5G.',
    bestFor: 'Download file besar, Streaming 4K UHD, YouTube/TikTok HD, & kecepatan puncak harian',
  },
  {
    id: 'tsel-aha-gaming',
    carrierId: 'telkomsel',
    name: 'Telkomsel Pro Gaming Anti-Jitter (AHA IPv4)',
    apn: 'aha',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '10',
    focus: 'gaming',
    estimatedSpeedScore: 85,
    estimatedStabilityScore: 96,
    summary:
      'Mengunci protokol IPv4 murni dan radio LTE tanpa translasi dual-stack berlebih; efektif menekan lonjakan ping merah saat jam padat.',
    bestFor: 'Mobile Legends, PUBG Mobile, Free Fire, Valorant tethered, & Honor of Kings',
  },
  {
    id: 'tsel-telkomsel-auth',
    carrierId: 'telkomsel',
    name: 'Telkomsel Jalur Alternatif (WAP Auth)',
    apn: 'telkomsel',
    username: 'wap',
    password: 'wap123',
    proxy: '',
    port: '',
    authType: 'PAP',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '10',
    focus: 'balanced',
    estimatedSpeedScore: 86,
    estimatedStabilityScore: 89,
    summary:
      'Gateway autentikasi klasik Telkomsel (tanpa proxy lawas) sebagai rute alternatif ketika gateway APN internet sedang mengalami kepadatan CGNAT.',
    bestFor: 'Cadangan saat APN utama melambat pada jam sibuk 19.00–22.00',
  },
  {
    id: 'tsel-orbit-hotspot',
    carrierId: 'telkomsel',
    name: 'Telkomsel Orbit & Hotspot Tethering (DUN)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,ims,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '10',
    focus: 'hotspot',
    estimatedSpeedScore: 92,
    estimatedStabilityScore: 90,
    summary:
      'Dilengkapi flag DUN (Dial-Up Networking) & IMS VoLTE agar sesi hotspot ke laptop/PC maupun modem Telkomsel Orbit tidak mudah putus.',
    bestFor: 'Modem Telkomsel Orbit, Hotspot kerja remote, & VoLTE HD',
  },

  // ================= BY.U DIGITAL =================
  {
    id: 'byu-official-fast',
    carrierId: 'byu',
    name: 'by.U Resmi Max Speed (Dual-Stack)',
    apn: 'byu',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '10',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 94,
    estimatedStabilityScore: 86,
    summary:
      'Titik akses resmi kartu digital by.U tanpa proxy untuk kecepatan penuh jaringan 4G+/5G Telkomsel.',
    bestFor: 'Kecepatan download tertinggi kuota utama & topping by.U',
  },
  {
    id: 'byu-gaming-ipv4',
    carrierId: 'byu',
    name: 'by.U Gaming Stabil Anti-Lag (IPv4 LTE)',
    apn: 'byu',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '10',
    focus: 'gaming',
    estimatedSpeedScore: 86,
    estimatedStabilityScore: 95,
    summary:
      'Mengunci sesi by.U ke jalur IPv4 murni dan mengunci radio LTE guna mencegah perpindahan sinyal 4G/3G yang memicu freeze saat war.',
    bestFor: 'Push rank Mobile Legends, PUBG, Free Fire, & Discord stabil',
  },
  {
    id: 'byu-core-tsel',
    carrierId: 'byu',
    name: 'by.U Rute Inti Telkomsel (internet)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '10',
    focus: 'balanced',
    estimatedSpeedScore: 91,
    estimatedStabilityScore: 88,
    summary:
      'Mengalihkan trafik kartu by.U langsung ke gateway APN internet induk Telkomsel saat gateway byu sedang padat.',
    bestFor: 'Alternatif ampuh ketika koneksi by.U terasa bengong',
  },
  {
    id: 'byu-hotspot-dun',
    carrierId: 'byu',
    name: 'by.U Hotspot Anak Kost & Laptop (DUN)',
    apn: 'byu',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '10',
    focus: 'hotspot',
    estimatedSpeedScore: 91,
    estimatedStabilityScore: 89,
    summary:
      'Menambahkan parameter DUN untuk menjaga kestabilan NAT saat kartu by.U dipakai tethering Wi-Fi ke laptop seharian.',
    bestFor: 'Berbagi hotspot Wi-Fi ke laptop, kuliah online, & kerja cloud',
  },

  // ================= INDOSAT IM3 =================
  {
    id: 'isat-gprs-fast',
    carrierId: 'indosat',
    name: 'Indosat IM3 Resmi (Turbo Dual-Stack)',
    apn: 'indosatgprs',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '01',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 95,
    estimatedStabilityScore: 86,
    summary:
      'APN resmi Indosat Ooredoo Hutchison dengan username & password dikosongkan (menghindari limitasi sesi legacy indosat@gprs).',
    bestFor: 'Kecepatan puncak 4G+/5G Indosat IM3 & streaming 4K',
  },
  {
    id: 'isat-ipv4-stable',
    carrierId: 'indosat',
    name: 'Indosat Pro Gaming Ping Rata (Core IPv4)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '01',
    focus: 'gaming',
    estimatedSpeedScore: 86,
    estimatedStabilityScore: 95,
    summary:
      'Memakai gateway universal jaringan inti IOH pada IPv4 murni untuk menjaga konsistensi paket UDP game kompetitif & VoIP.',
    bestFor: 'Game kompetitif anti-rubberbanding & panggilan video stabil',
  },
  {
    id: 'isat-3g-alt',
    carrierId: 'indosat',
    name: 'Indosat Jalur Alternatif (indosat3g Clean)',
    apn: 'indosat3g',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '01',
    focus: 'balanced',
    estimatedSpeedScore: 85,
    estimatedStabilityScore: 90,
    summary:
      'Rute alternatif tanpa proxy 10.19.19.19 lawas yang kerap lebih lengang ketika gateway indosatgprs padat di malam hari.',
    bestFor: 'Cadangan saat jam sibuk prime-time jaringan Indosat',
  },
  {
    id: 'isat-hotspot-dun',
    carrierId: 'indosat',
    name: 'Indosat HiFi Air / Tethering + VoLTE (DUN)',
    apn: 'indosatgprs',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,ims,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '01',
    focus: 'hotspot',
    estimatedSpeedScore: 91,
    estimatedStabilityScore: 89,
    summary:
      'Menyertakan flag IMS (VoLTE) dan DUN untuk menjaga kestabilan berbagi koneksi hotspot maupun modem Indosat HiFi Air.',
    bestFor: 'Tethering kerja remote, upload cloud, & modem HiFi Air',
  },

  // ================= TRI (3) =================
  {
    id: 'tri-3data-fast',
    carrierId: 'tri',
    name: 'Tri 3data Resmi (MOCN High-Speed)',
    apn: '3data',
    username: '3data',
    password: '3data',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '89',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 94,
    estimatedStabilityScore: 86,
    summary:
      'Profil utama resmi kartu Tri (3) pada jaringan gabungan MOCN IOH dengan throughput download & upload paling tinggi.',
    bestFor: 'Kecepatan download maksimal harian, YouTube/Netflix, & medsos',
  },
  {
    id: 'tri-3gprs-gaming',
    carrierId: 'tri',
    name: 'Tri H3RO Gaming Anti-Padat (3gprs IPv4)',
    apn: '3gprs',
    username: '3gprs',
    password: '3gprs',
    proxy: '',
    port: '',
    authType: 'PAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '89',
    focus: 'gaming',
    estimatedSpeedScore: 85,
    estimatedStabilityScore: 95,
    summary:
      'Jalur gaming tanpa proxy dengan penguncian IPv4 & LTE; terbukti lebih stabil meredam lonjakan ping saat gateway 3data penuh.',
    bestFor: 'Mobile Legends, PUBG, Free Fire, Genshin Impact, & ping hijau stabil',
  },
  {
    id: 'tri-internet-ioh',
    carrierId: 'tri',
    name: 'Tri Fusion Jaringan IOH (internet)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '89',
    focus: 'balanced',
    estimatedSpeedScore: 90,
    estimatedStabilityScore: 89,
    summary:
      'Memanfaatkan titik akses terpadu jaringan inti Indosat-Tri (IOH) tanpa kredensial tambahan untuk mobilitas antar-kota.',
    bestFor: 'Kartu Tri baru & perpindahan menara MOCN IOH yang mulus',
  },
  {
    id: 'tri-hotspot-dun',
    carrierId: 'tri',
    name: 'Tri AlwaysOn Hotspot & Modem (DUN)',
    apn: '3data',
    username: '3data',
    password: '3data',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '89',
    focus: 'hotspot',
    estimatedSpeedScore: 90,
    estimatedStabilityScore: 88,
    summary:
      'Profil khusus berbagi Wi-Fi Tethering kartu Tri AlwaysOn/Happy agar koneksi di laptop tetap responsif.',
    bestFor: 'Tethering laptop, modem 4G kartu Tri, & streaming TV',
  },

  // ================= XL AXIATA =================
  {
    id: 'xl-internet-fast',
    carrierId: 'xl',
    name: 'XL Axiata Default Turbo (4G+/5G Dual-Stack)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '11',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 95,
    estimatedStabilityScore: 87,
    summary:
      'Konfigurasi resmi modern XL Prabayar, PRIORITAS, & XL SATU tanpa proxy untuk memaksimalkan Carrier Aggregation 4G+ dan 5G.',
    bestFor: 'Throughput tertinggi di seluruh paket XL, Akrab, & PRIORITAS',
  },
  {
    id: 'xl-xlgprs-alt',
    carrierId: 'xl',
    name: 'XL Pro Gaming Low-Jitter (xlgprs IPv4)',
    apn: 'www.xlgprs.net',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '11',
    focus: 'gaming',
    estimatedSpeedScore: 86,
    estimatedStabilityScore: 95,
    summary:
      'Mengarahkan sesi ke PGW IPv4 murni dengan penguncian LTE guna menghindari pergantian alamat dual-stack yang memicu lag sesaat.',
    bestFor: 'Stabilitas ping game kompetitif (MLBB, PUBG, Valorant) & VoIP panjang',
  },
  {
    id: 'xl-unlimited-liveon',
    carrierId: 'xl',
    name: 'XL Unlimited / Live.On Alternatif (xlunlimited)',
    apn: 'xlunlimited',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '11',
    focus: 'balanced',
    estimatedSpeedScore: 89,
    estimatedStabilityScore: 89,
    summary:
      'Gateway alternatif jaringan XL Axiata & eks-Live.On ketika jalur utama mengalami antrean trafik regional.',
    bestFor: 'Pengguna paket XL Akrab / Live.On & cadangan malam hari',
  },
  {
    id: 'xl-hotspot-dun',
    carrierId: 'xl',
    name: 'XL SATU & Hotspot Tethering (DUN + VoLTE)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,ims,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '11',
    focus: 'hotspot',
    estimatedSpeedScore: 92,
    estimatedStabilityScore: 90,
    summary:
      'Mengaktifkan dukungan simultan VoLTE (ims) dan berbagi koneksi multi-perangkat (dun) untuk paket keluarga XL Akrab/SATU.',
    bestFor: 'Berbagi kuota hotspot keluarga, kerja WFH, & modem XL Home',
  },

  // ================= AXIS =================
  {
    id: 'axis-turbo-internet',
    carrierId: 'axis',
    name: 'AXIS Turbo Max Speed (Direct Dual-Stack)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '08',
    focus: 'speed',
    estimatedSpeedScore: 94,
    estimatedStabilityScore: 86,
    summary:
      'Melewati proxy klasik AXIS (10.8.3.8) sepenuhnya dan langsung terhubung ke backbone cepat 4G+ XL Axiata.',
    bestFor: 'Download tercepat kartu AXIS Bronet, Suka-Suka, & streaming HD',
  },
  {
    id: 'axis-owsem-gaming',
    carrierId: 'axis',
    name: 'AXIS OWSEM Gaming Anti-Ping Merah (IPv4)',
    apn: 'www.xlgprs.net',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '08',
    focus: 'gaming',
    estimatedSpeedScore: 85,
    estimatedStabilityScore: 95,
    summary:
      'Racikan favorit pengguna paket AXIS OWSEM / Forever Play: mengunci IPv4 murni & radio LTE agar jitter rata saat turnamen/push rank.',
    bestFor: 'Free Fire, Mobile Legends, PUBG Mobile, & kuota game AXIS OWSEM',
  },
  {
    id: 'axis-dedicated-clean',
    carrierId: 'axis',
    name: 'AXIS Default Resmi Tanpa Proxy (AXIS Clean)',
    apn: 'AXIS',
    username: 'axis',
    password: '123456',
    proxy: '',
    port: '',
    authType: 'PAP',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    mcc: '510',
    mnc: '08',
    focus: 'balanced',
    isOfficialDefault: true,
    estimatedSpeedScore: 90,
    estimatedStabilityScore: 88,
    summary:
      'Profil bawaan kartu AXIS yang sudah dibersihkan dari proxy 10.8.3.8 port 8080 lawas (penyebab utama internet AXIS terasa tercekik!).',
    bestFor: 'Pemakaian harian stabil kartu AXIS Bronet & Warnet',
  },
  {
    id: 'axis-warnet-hotspot',
    carrierId: 'axis',
    name: 'AXIS Warnet & Hotspot Tethering (DUN)',
    apn: 'AXIS',
    username: 'axis',
    password: '123456',
    proxy: '',
    port: '',
    authType: 'PAP',
    apnType: 'default,supl,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '08',
    focus: 'hotspot',
    estimatedSpeedScore: 89,
    estimatedStabilityScore: 89,
    summary:
      'Menambahkan atribut DUN tanpa proxy agar paket AXIS Warnet Unlimited / Bronet lancar dibagikan ke laptop atau perangkat kedua.',
    bestFor: 'Paket AXIS Warnet jam-jaman & tethering Wi-Fi',
  },

  // ================= SMARTFREN =================
  {
    id: 'sf-4g-volte',
    carrierId: 'smartfren',
    name: 'Smartfren Resmi Turbo (4G + VoLTE)',
    apn: 'smartfren4g',
    username: 'smartfren',
    password: 'smartfren',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl,ims',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '09',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 93,
    estimatedStabilityScore: 88,
    summary:
      'Profil utama resmi Smartfren dengan tipe ims aktif agar telepon suara HD (VoLTE) tetap hidup bersamaan dengan kecepatan puncak 4G LTE.',
    bestFor: 'Kecepatan download optimal paket Unlimited Nonstop, Gokil Max, & Kuota',
  },
  {
    id: 'sf-internet-pure',
    carrierId: 'smartfren',
    name: 'Smartfren Gaming Low-Overhead (Pure IPv4)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,ims',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '09',
    focus: 'gaming',
    estimatedSpeedScore: 87,
    estimatedStabilityScore: 95,
    summary:
      'Tanpa autentikasi PAP/CHAP tambahan dan mengunci IPv4 tunggal pada jaringan 100% 4G Smartfren untuk respons ping game paling stabil.',
    bestFor: 'Main game online kompetitif anti-lag di jaringan Smartfren',
  },
  {
    id: 'sf-alt-pgw',
    carrierId: 'smartfren',
    name: 'Smartfren Jalur Alternatif (smartfren CHAP)',
    apn: 'smartfren',
    username: 'smartfren',
    password: 'smartfren',
    proxy: '',
    port: '',
    authType: 'CHAP',
    apnType: 'default,supl,ims',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '28',
    focus: 'balanced',
    estimatedSpeedScore: 86,
    estimatedStabilityScore: 91,
    summary:
      'Rute gateway sekunder Smartfren menggunakan autentikasi CHAP ketika jalur smartfren4g padat pada malam hari.',
    bestFor: 'Alternatif ketika sinyal Smartfren penuh tapi kecepatan tertahan',
  },
  {
    id: 'sf-connex-mifi',
    carrierId: 'smartfren',
    name: 'Smartfren Modem MiFi Connex & Hotspot (DUN)',
    apn: 'smartfren4g',
    username: 'smartfren',
    password: 'smartfren',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl,ims,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    mcc: '510',
    mnc: '09',
    focus: 'hotspot',
    estimatedSpeedScore: 90,
    estimatedStabilityScore: 90,
    summary:
      'Dioptimalkan untuk Modem Wi-Fi Smartfren Connex / Andromax MiFi dan hotspot HP jarak jauh.',
    bestFor: 'Modem MiFi Smartfren, tethering multi-perangkat, & CCTV cloud',
  },

  // ================= UNIVERSAL / MODEM =================
  {
    id: 'uni-internet-max',
    carrierId: 'universal',
    name: 'Universal High-Throughput (Dual-Stack 4G/5G)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    focus: 'speed',
    isOfficialDefault: true,
    estimatedSpeedScore: 93,
    estimatedStabilityScore: 86,
    summary:
      'Standar emas mayoritas operator modern Indonesia & dunia: APN internet tanpa proxy & Dual-Stack IPv4/IPv6 untuk throughput penuh.',
    bestFor: 'Modem router 4G/5G unlocked (Huawei/ZTE/TP-Link), eSIM travel, & umum',
  },
  {
    id: 'uni-gaming-ipv4',
    carrierId: 'universal',
    name: 'Universal Low-Jitter Gaming (Pure IPv4 LTE)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'PAP or CHAP',
    apnType: 'default,supl',
    protocol: 'IPv4',
    roamingProtocol: 'IPv4',
    bearer: 'LTE',
    focus: 'gaming',
    estimatedSpeedScore: 85,
    estimatedStabilityScore: 94,
    summary:
      'Memaksa jalur IPv4 tunggal dan mengunci radio LTE guna mencegah perpindahan sel 3G/4G yang memicu lonjakan ping pada game.',
    bestFor: 'Stabilitas ping game kompetitif & Zoom HD pada sinyal fluktuatif',
  },
  {
    id: 'uni-router-dun',
    carrierId: 'universal',
    name: 'Modem Router 4G/5G Rumah & Kantor (DUN)',
    apn: 'internet',
    username: '',
    password: '',
    proxy: '',
    port: '',
    authType: 'None',
    apnType: 'default,supl,dun',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    focus: 'hotspot',
    estimatedSpeedScore: 91,
    estimatedStabilityScore: 90,
    summary:
      'Profil khusus router CPE 4G/5G rumah/toko dengan dukungan DUN agar puluhan perangkat Wi-Fi tetap lancar.',
    bestFor: 'Router 4G/5G rumah, kasir POS, & Smart TV',
  },
];

/**
 * Detects which Indonesian mobile carrier matches the active network ISP/ASN.
 * Also flags whether the user appears to be on Fixed Fiber/Wi-Fi ISP so UI can inform them clearly.
 */
export function detectCarrierFromNetwork(meta: NetworkMeta | null): {
  carrierId: CarrierId;
  isFixedBroadband: boolean;
  detectedNote: string;
  networkSummaryLabel: string;
} {
  if (!meta) {
    return {
      carrierId: 'telkomsel',
      isFixedBroadband: false,
      detectedNote: 'Mendeteksi otomatis kartu SIM & operator jaringan Indonesia Anda...',
      networkSummaryLabel: 'Mendeteksi Jaringan...',
    };
  }

  const asnClean = (meta.asn || '').replace(/^AS/i, '').trim();
  const ispLower = (meta.isp || '').toLowerCase();
  const radioSuffix = meta.connectionType ? ` • ${meta.connectionType}` : '';

  if (ispLower.includes('by.u') || ispLower.includes('byu')) {
    return {
      carrierId: 'byu',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi menggunakan kartu digital by.U pada jaringan Telkomsel (${meta.asn || 'AS23693'}${radioSuffix}).`,
      networkSummaryLabel: `by.U Digital (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (asnClean === '23693' || ispLower.includes('telkomsel') || ispLower.includes('kartu halo')) {
    return {
      carrierId: 'telkomsel',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan jaringan seluler Telkomsel (${meta.asn || 'AS23693'}${radioSuffix}). Jika memakai kartu digital by.U, Anda juga dapat memilih tab by.U.`,
      networkSummaryLabel: `Telkomsel Seluler (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (asnClean === '55699' || ispLower.includes('hutchison') || /\btri\b/.test(ispLower) || ispLower.includes('3 indonesia')) {
    return {
      carrierId: 'tri',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan jaringan Tri Indonesia / 3 (${meta.asn || 'IOH'}${radioSuffix}).`,
      networkSummaryLabel: `Tri (3) Indonesia (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (asnClean === '4761' || ispLower.includes('indosat') || ispLower.includes('ioh') || ispLower.includes('im3')) {
    return {
      carrierId: 'indosat',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan jaringan Indosat Ooredoo Hutchison (${meta.asn || 'AS4761'}${radioSuffix}). Jika memakai kartu Tri (3), pilih tab Tri (3).`,
      networkSummaryLabel: `Indosat IM3 / IOH (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (ispLower.includes('axis') || ispLower.includes('nts')) {
    return {
      carrierId: 'axis',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan kartu AXIS pada jaringan XL Axiata (${meta.asn || 'AS24203'}${radioSuffix}).`,
      networkSummaryLabel: `AXIS Seluler (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (asnClean === '24203' || ispLower.includes('xl') || ispLower.includes('axiata')) {
    return {
      carrierId: 'xl',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan jaringan XL Axiata (${meta.asn || 'AS24203'}${radioSuffix}). Jika memakai kartu AXIS, pilih tab AXIS.`,
      networkSummaryLabel: `XL Axiata (${meta.ipVersion || 'IPv4'})`,
    };
  }

  if (asnClean === '45147' || asnClean === '133809' || ispLower.includes('smartfren')) {
    return {
      carrierId: 'smartfren',
      isFixedBroadband: false,
      detectedNote: `Terdeteksi otomatis menggunakan jaringan 4G/5G Smartfren (${meta.asn || 'AS45147'}${radioSuffix}).`,
      networkSummaryLabel: `Smartfren 4G/5G (${meta.ipVersion || 'IPv4'})`,
    };
  }

  // Fixed Fiber / Wi-Fi ISP (IndiHome AS7713, Biznet, FirstMedia, MyRepublic, CBN, Iconnet, Starlink, etc.)
  return {
    carrierId: 'telkomsel',
    isFixedBroadband: true,
    detectedNote: `Saat ini perangkat Anda terhubung melalui Wi-Fi / Fiber ISP "${meta.isp}" (${meta.asn || 'Broadband'}${radioSuffix}). Matikan Wi-Fi untuk menguji data seluler secara langsung, atau pilih kartu SIM Anda di bawah untuk menyiapkan APN Tercepat / Stabil Game.`,
    networkSummaryLabel: `Wi-Fi / Fiber: ${meta.isp}`,
  };
}

/**
 * Generates an optimized Custom APN configuration tailored to the active Indonesian carrier & goal.
 */
export function generateSmartApnRecipe(
  carrierId: CarrierId,
  focus: ApnFocusTag,
  latestResult?: SpeedtestHistoryEntry | null
): Omit<ApnProfile, 'id'> {
  const carrier = CARRIER_CATALOG[carrierId];

  const baseApnByCarrier: Record<CarrierId, { speed: string; gaming: string; hotspot: string }> = {
    telkomsel: { speed: 'internet', gaming: 'aha', hotspot: 'internet' },
    byu: { speed: 'byu', gaming: 'byu', hotspot: 'byu' },
    indosat: { speed: 'indosatgprs', gaming: 'internet', hotspot: 'indosatgprs' },
    tri: { speed: '3data', gaming: '3gprs', hotspot: '3data' },
    xl: { speed: 'internet', gaming: 'www.xlgprs.net', hotspot: 'internet' },
    axis: { speed: 'internet', gaming: 'www.xlgprs.net', hotspot: 'AXIS' },
    smartfren: { speed: 'smartfren4g', gaming: 'internet', hotspot: 'smartfren4g' },
    universal: { speed: 'internet', gaming: 'internet', hotspot: 'internet' },
  };

  const chosenApn =
    focus === 'gaming'
      ? baseApnByCarrier[carrierId].gaming
      : focus === 'hotspot'
      ? baseApnByCarrier[carrierId].hotspot
      : baseApnByCarrier[carrierId].speed;

  const highJitterDetected = latestResult && latestResult.jitterMs > 10;
  const needsTriCreds = carrierId === 'tri' && (chosenApn === '3data' || chosenApn === '3gprs');
  const needsAxisCreds = carrierId === 'axis' && chosenApn === 'AXIS';
  const needsSfCreds = carrierId === 'smartfren' && chosenApn === 'smartfren4g';

  const username = needsTriCreds
    ? chosenApn
    : needsAxisCreds
    ? 'axis'
    : needsSfCreds
    ? 'smartfren'
    : '';
  const password = needsTriCreds
    ? chosenApn
    : needsAxisCreds
    ? '123456'
    : needsSfCreds
    ? 'smartfren'
    : '';

  if (focus === 'gaming') {
    return {
      carrierId,
      name: `Juru ${carrier.shortName} Stabil Game (Anti-Lag IPv4)`,
      apn: chosenApn,
      username,
      password,
      proxy: '',
      port: '',
      authType: 'PAP or CHAP',
      apnType: carrierId === 'smartfren' ? 'default,supl,ims' : 'default,supl',
      protocol: 'IPv4',
      roamingProtocol: 'IPv4',
      bearer: 'LTE',
      focus: 'gaming',
      isCustom: true,
      estimatedSpeedScore: 86,
      estimatedStabilityScore: 96,
      summary: highJitterDetected
        ? `Diracik khusus karena jitter Anda tercatat ${latestResult.jitterMs.toFixed(
            1
          )} ms. Mengunci IPv4 murni & Bearer LTE pada ${carrier.shortName} untuk meredam lonjakan ping saat main game.`
        : `Racikan khusus stabilitas game ${carrier.shortName}: mematikan proxy & mengunci IPv4 murni + LTE agar paket UDP Mobile Legends/PUBG/FF konsisten.`,
      bestFor: 'Main game kompetitif (MLBB, PUBG, FF, Valorant) & minimalkan jitter',
    };
  }

  if (focus === 'hotspot') {
    return {
      carrierId,
      name: `Juru ${carrier.shortName} Hotspot & Modem Pro`,
      apn: chosenApn,
      username,
      password,
      proxy: '',
      port: '',
      authType: username ? 'PAP or CHAP' : 'None',
      apnType:
        carrierId === 'smartfren' ? 'default,supl,ims,dun' : 'default,supl,dun',
      protocol: 'IPv4/IPv6',
      roamingProtocol: 'IPv4',
      bearer: 'Unspecified',
      focus: 'hotspot',
      isCustom: true,
      estimatedSpeedScore: 92,
      estimatedStabilityScore: 90,
      summary: `Racikan hotspot & modem ${carrier.shortName} dengan atribut DUN (Dial-Up Networking) tanpa proxy agar koneksi laptop/multi-perangkat stabil seharian.`,
      bestFor: 'Hotspot HP seharian, Modem Orbit/MiFi, & kerja remote',
    };
  }

  // Default: Max Speed ('speed' | 'balanced')
  return {
    carrierId,
    name: `Juru ${carrier.shortName} Kecepatan Puncak 4G+/5G`,
    apn: chosenApn,
    username,
    password,
    proxy: '',
    port: '',
    authType: username ? 'PAP or CHAP' : 'None',
    apnType: carrierId === 'smartfren' ? 'default,supl,ims' : 'default,supl',
    protocol: 'IPv4/IPv6',
    roamingProtocol: 'IPv4',
    bearer: 'Unspecified',
    focus: 'speed',
    isCustom: true,
    estimatedSpeedScore: 96,
    estimatedStabilityScore: 88,
    summary: `Racikan throughput puncak ${carrier.shortName}: jalur langsung tanpa proxy/port dengan Dual-Stack IPv4/IPv6 untuk memaksimalkan bandwidth unduh & unggah.`,
    bestFor: 'Kecepatan download/upload maksimal & streaming 4K HDR',
  };
}

/**
 * Ranks APN profiles by combining empirical Speedtest history (when tested!)
 * with engineering baseline scores (for untested profiles) and produces distinct
 * Fastest ("Tercepat") and Most Stable Gaming ("Terstabil Main Game") winners.
 */
export function evaluateAndRankApns(
  profiles: ApnProfile[],
  history: SpeedtestHistoryEntry[]
): {
  ranked: ApnBenchmarkStats[];
  bestOverall: ApnBenchmarkStats | null;
  fastest: ApnBenchmarkStats | null;
  mostStable: ApnBenchmarkStats | null;
  hasEmpiricalComparison: boolean;
  testedApnCount: number;
  recommendationHeadline: string;
  recommendationDetail: string;
} {
  if (profiles.length === 0) {
    return {
      ranked: [],
      bestOverall: null,
      fastest: null,
      mostStable: null,
      hasEmpiricalComparison: false,
      testedApnCount: 0,
      recommendationHeadline: 'Belum ada profil APN pada kategori ini',
      recommendationDetail: 'Silakan pilih operator atau buat profil APN baru untuk memulai.',
    };
  }

  const matchingHistory = history.filter(h =>
    profiles.some(p => p.id === h.apnId)
  );
  const maxObservedDl = Math.max(
    35,
    ...matchingHistory.map(h => h.downloadMbps)
  );

  const stats: ApnBenchmarkStats[] = profiles.map(profile => {
    const runs = history.filter(h => h.apnId === profile.id);
    if (runs.length === 0) {
      const composite =
        profile.estimatedSpeedScore * 0.52 + profile.estimatedStabilityScore * 0.48;
      return {
        profile,
        testCount: 0,
        avgDownloadMbps: null,
        avgUploadMbps: null,
        avgPingMs: null,
        avgJitterMs: null,
        avgOverallScore: null,
        effectiveSpeedScore: profile.estimatedSpeedScore,
        effectiveStabilityScore: profile.estimatedStabilityScore,
        compositeRankScore: Number(composite.toFixed(1)),
      };
    }

    const avgDl = runs.reduce((s, r) => s + r.downloadMbps, 0) / runs.length;
    const avgUl = runs.reduce((s, r) => s + r.uploadMbps, 0) / runs.length;
    const avgPing = runs.reduce((s, r) => s + r.pingMs, 0) / runs.length;
    const avgJitter = runs.reduce((s, r) => s + r.jitterMs, 0) / runs.length;
    const avgLoss = runs.reduce((s, r) => s + r.packetLossPct, 0) / runs.length;
    const avgScore = runs.reduce((s, r) => s + r.overallScore, 0) / runs.length;

    const dlNorm = Math.min(100, (avgDl / maxObservedDl) * 92 + (avgUl > 10 ? 8 : (avgUl / 10) * 8));
    const empiricalSpeed = Math.max(12, Math.min(99, Math.round(dlNorm)));

    let stab = 98;
    if (avgPing > 100) stab -= 35;
    else if (avgPing > 60) stab -= 18;
    else if (avgPing > 35) stab -= 7;

    if (avgJitter > 20) stab -= 28;
    else if (avgJitter > 10) stab -= 14;
    else if (avgJitter > 4) stab -= 4;

    if (avgLoss > 0) stab -= Math.min(30, avgLoss * 10);
    const empiricalStability = Math.max(10, Math.min(99, Math.round(stab * 0.7 + avgScore * 0.3)));

    const composite = empiricalSpeed * 0.52 + empiricalStability * 0.48 + 3;

    return {
      profile,
      testCount: runs.length,
      avgDownloadMbps: Number(avgDl.toFixed(2)),
      avgUploadMbps: Number(avgUl.toFixed(2)),
      avgPingMs: Number(avgPing.toFixed(1)),
      avgJitterMs: Number(avgJitter.toFixed(1)),
      avgOverallScore: Math.round(avgScore),
      effectiveSpeedScore: empiricalSpeed,
      effectiveStabilityScore: empiricalStability,
      compositeRankScore: Number(composite.toFixed(1)),
    };
  });

  const ranked = [...stats].sort((a, b) => b.compositeRankScore - a.compositeRankScore);
  const testedItems = ranked.filter(r => r.testCount > 0);
  const testedApnCount = testedItems.length;
  const hasEmpiricalComparison = testedApnCount >= 2;

  const poolForWinners = testedApnCount >= 2 ? testedItems : ranked;
  const bestOverall = poolForWinners[0] || null;

  const speedSorted = [...poolForWinners].sort((a, b) => {
    if (a.avgDownloadMbps !== null && b.avgDownloadMbps !== null) {
      return b.avgDownloadMbps - a.avgDownloadMbps;
    }
    return b.effectiveSpeedScore - a.effectiveSpeedScore;
  });
  const fastest = speedSorted[0] || null;

  const stabilitySorted = [...poolForWinners].sort((a, b) => {
    if (a.avgJitterMs !== null && b.avgJitterMs !== null && a.avgPingMs !== null && b.avgPingMs !== null) {
      return a.avgPingMs + a.avgJitterMs * 2.2 - (b.avgPingMs + b.avgJitterMs * 2.2);
    }
    if (b.effectiveStabilityScore !== a.effectiveStabilityScore) {
      return b.effectiveStabilityScore - a.effectiveStabilityScore;
    }
    return (a.profile.focus === 'gaming' ? -1 : 1);
  });

  // Ensure users always get a meaningful choice between Fastest vs Most Stable Gaming when >= 2 profiles exist
  let mostStable = stabilitySorted[0] || null;
  if (
    mostStable &&
    fastest &&
    mostStable.profile.id === fastest.profile.id &&
    stabilitySorted.length > 1
  ) {
    const gamingAlt =
      stabilitySorted.find(
        s => s.profile.id !== fastest.profile.id && s.profile.focus === 'gaming'
      ) || stabilitySorted[1];
    if (gamingAlt) {
      mostStable = gamingAlt;
    }
  }

  let recommendationHeadline = '';
  let recommendationDetail = '';

  if (hasEmpiricalComparison && bestOverall) {
    recommendationHeadline = `Hasil Adu Riil ${testedApnCount} APN: "${fastest?.profile.name}" (Tercepat) vs "${mostStable?.profile.name}" (Terstabil Game)`;
    recommendationDetail = `Di menara BTS lokasi Anda saat ini, "${
      fastest?.profile.name
    }" unggul untuk kecepatan unduh (${fastest?.avgDownloadMbps} Mbps), sedangkan "${
      mostStable?.profile.name
    }" unggul untuk kestabilan main game (Ping ${mostStable?.avgPingMs} ms, Jitter ±${
      mostStable?.avgJitterMs
    } ms). Pilih sesuai kebutuhan Anda saat ini!`;
  } else if (testedApnCount === 1 && testedItems[0]) {
    const first = testedItems[0];
    recommendationHeadline = `Data Awal Tercatat (${first.profile.apn}: ${first.avgDownloadMbps} Mbps, Ping ${Math.round(first.avgPingMs || 0)} ms) — Saatnya Pilih Mode Optimasi!`;
    recommendationDetail = `Ingin unduhan & streaming lebih ngebut? Pilih rekomendasi APN Tercepat (${
      fastest?.profile.apn
    }). Atau ingin ping hijau stabil anti-lag buat main game? Pilih APN Terstabil (${
      mostStable?.profile.apn
    }), terapkan di HP, lalu uji kembali untuk melihat perbandingan Sebelum vs Sesudah!`;
  } else if (fastest && mostStable) {
    recommendationHeadline = `Rekomendasi Siap Pakai: Mode Cepat (${fastest.profile.apn}) atau Stabil Game (${mostStable.profile.apn})`;
    recommendationDetail = `Lakukan uji kecepatan awal terlebih dahulu, lalu pilih sendiri: gunakan "${fastest.profile.name}" untuk mengejar Mbps tertinggi (Dual-Stack tanpa proxy) atau "${mostStable.profile.name}" (${mostStable.profile.protocol}) untuk mengunci ping stabil saat main game kompetitif.`;
  }

  return {
    ranked,
    bestOverall,
    fastest,
    mostStable,
    hasEmpiricalComparison,
    testedApnCount,
    recommendationHeadline,
    recommendationDetail,
  };
}

export function formatApnParametersText(p: ApnProfile): string {
  return [
    `Nama: ${p.name}`,
    `APN: ${p.apn}`,
    `Proxy: ${p.proxy || 'Tidak disetel (Kosongkan)'}`,
    `Port: ${p.port || 'Tidak disetel (Kosongkan)'}`,
    `Nama Pengguna (Username): ${p.username || 'Kosongkan'}`,
    `Kata Sandi (Password): ${p.password || 'Kosongkan'}`,
    `Jenis Autentikasi: ${p.authType}`,
    `Jenis APN (APN Type): ${p.apnType}`,
    `Protokol APN: ${p.protocol}`,
    `Protokol Roaming APN: ${p.roamingProtocol}`,
    `Operator / Bearer: ${p.bearer}`,
    ...(p.mcc && p.mnc ? [`MCC / MNC Resmi: ${p.mcc} / ${p.mnc}`] : []),
  ].join('\n');
}

/**
 * Attempts to launch Android's native Access Point Names settings screen via Intent URI.
 */
export function openAndroidApnSettingsScreen(): { isAndroid: boolean } {
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  if (isAndroid) {
    window.location.href = 'intent:#Intent;action=android.settings.APN_SETTINGS;end';
  }
  return { isAndroid };
}

/**
 * Generates and downloads an Apple iOS Configuration Profile (.mobileconfig) for the APN.
 */
export function downloadIosMobileConfig(profile: ApnProfile): void {
  const uuid1 = crypto.randomUUID
    ? crypto.randomUUID()
    : `juru-${Date.now()}-payload`;
  const uuid2 = crypto.randomUUID ? crypto.randomUUID() : `juru-${Date.now()}-root`;

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const authTypeIos = profile.authType === 'CHAP' ? 'CHAP' : 'PAP';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>APNs</key>
      <array>
        <dict>
          <key>AuthenticationType</key>
          <string>${authTypeIos}</string>
          <key>Name</key>
          <string>${escapeXml(profile.apn)}</string>${
    profile.username
      ? `
          <key>Username</key>
          <string>${escapeXml(profile.username)}</string>`
      : ''
  }${
    profile.password
      ? `
          <key>Password</key>
          <string>${escapeXml(profile.password)}</string>`
      : ''
  }
        </dict>
      </array>
      <key>AttachAPN</key>
      <dict>
        <key>AuthenticationType</key>
        <string>${authTypeIos}</string>
        <key>Name</key>
        <string>${escapeXml(profile.apn)}</string>
      </dict>
      <key>PayloadDescription</key>
      <string>Konfigurasi APN ${escapeXml(profile.name)} oleh Juru Speedtest</string>
      <key>PayloadDisplayName</key>
      <string>${escapeXml(profile.name)}</string>
      <key>PayloadIdentifier</key>
      <string>id.juru.speedtest.apn.${escapeXml(profile.id)}</string>
      <key>PayloadType</key>
      <string>com.apple.cellular</string>
      <key>PayloadUUID</key>
      <string>${uuid1}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Profil APN Seluler Indonesia — dibuat melalui Juru Speedtest</string>
  <key>PayloadDisplayName</key>
  <string>Juru APN - ${escapeXml(profile.name)}</string>
  <key>PayloadIdentifier</key>
  <string>id.juru.speedtest.profile.${escapeXml(profile.id)}</string>
  <key>PayloadOrganization</key>
  <string>Juru Speedtest Indonesia</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${uuid2}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

  const blob = new Blob([xml], { type: 'application/x-apple-aspen-config' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `juru-apn-${profile.apn.replace(/[^a-z0-9]/gi, '-')}.mobileconfig`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
