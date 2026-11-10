export type SubscriptionPlan = 'free' | 'lifetime_pro';

export type OptimizationModeChoice = 'speed' | 'gaming';

export type TestStageRole = 'before' | 'after_speed' | 'after_gaming' | 'general';

export type TestPhase =
  | 'idle'
  | 'init'
  | 'ping'
  | 'download'
  | 'upload'
  | 'complete'
  | 'aborted'
  | 'error';

export type TestProfileId = 'quick' | 'standard' | 'precision';

export type SpeedUnit = 'Mbps' | 'MB/s';

export interface TestProfile {
  id: TestProfileId;
  label: string;
  description: string;
  pingSamples: number;
  downloadDurationMs: number;
  uploadDurationMs: number;
  parallelStreams: number;
}

export interface SpeedSample {
  /** Elapsed ms within the phase */
  elapsedMs: number;
  /** Throughput in Mbps */
  mbps: number;
}

export interface NetworkMeta {
  ip: string;
  isp: string;
  asn: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  coloCode: string;
  coloCity: string;
  connectionType?: string;
  connectionCategory?: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveRadio?: string;
  downlinkHintMbps?: number;
  rttHintMs?: number;
  saveData?: boolean;
  ipVersion?: string;
  isCellularIsp?: boolean;
}

export type BufferbloatGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface LatencyMetrics {
  unloadedMs: number;
  minMs: number;
  maxMs: number;
  jitterMs: number;
  packetLossPct: number;
  downloadLoadedMs: number | null;
  uploadLoadedMs: number | null;
  samples: number[];
}

export interface SpeedtestLiveState {
  phase: TestPhase;
  phaseProgress: number; // 0..100 within current phase
  overallProgress: number; // 0..100 overall
  currentGaugeMbps: number;
  downloadMbps: number;
  downloadPeakMbps: number;
  downloadBytes: number;
  uploadMbps: number;
  uploadPeakMbps: number;
  uploadBytes: number;
  latency: LatencyMetrics;
  downloadSeries: SpeedSample[];
  uploadSeries: SpeedSample[];
  networkMeta: NetworkMeta | null;
  errorMessage: string | null;
}

export interface ActivityRating {
  id: 'streaming' | 'gaming' | 'videocall' | 'cloud';
  title: string;
  subtitle: string;
  score: number; // 0..100
  tier: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  detail: string;
}

export interface FupAnalysis {
  isSuspectedFup: boolean;
  detectedCeilingMbps: number | null;
  confidence: 'tinggi' | 'sedang' | 'normal';
  headline: string;
  detail: string;
  remedy: string;
}

export interface NetworkDiagnosis {
  overallScore: number; // 0..100
  gamingScore: number; // 0..100
  headline: string;
  summary: string;
  bufferbloatGrade: BufferbloatGrade;
  bufferbloatDeltaMs: number;
  bufferbloatLabel: string;
  fupAnalysis: FupAnalysis;
  tips: string[];
  activities: ActivityRating[];
}

export interface GameServerTarget {
  id: string;
  gameTitle: string;
  shortName: string;
  publisher: string;
  regionLabel: string;
  serverCity: string;
  probeUrl: string;
  fallbackLatencyOffsetMs: number;
  genreTag: 'MOBA' | 'Battle Royale' | 'FPS' | 'Open World / RPG';
}

export interface GameServerProbeResult {
  target: GameServerTarget;
  pingMs: number;
  jitterMs: number;
  status: 'excellent' | 'good' | 'lag_risk';
  statusLabel: string;
  testedAt: string;
  isLiveProbe: boolean;
}

export interface DnsProviderTarget {
  id: string;
  name: string;
  primaryIp: string;
  secondaryIp: string;
  androidPrivateDnsHost: string;
  probeUrl: string;
  focusTag: 'gaming' | 'speed' | 'adblock' | 'security';
  badge: string;
  description: string;
}

export interface DnsBenchmarkResult {
  provider: DnsProviderTarget;
  latencyMs: number;
  rank: number;
}

export interface CarrierLteBandGuide {
  carrierId: CarrierId;
  speedBands: string;
  gamingStableBands: string;
  indoorCoverageBands: string;
  fiveGBands: string;
  lockRecommendation: string;
}

export type CarrierId =
  | 'telkomsel'
  | 'byu'
  | 'indosat'
  | 'tri'
  | 'xl'
  | 'axis'
  | 'smartfren'
  | 'universal';

export type ApnProtocol = 'IPv4' | 'IPv6' | 'IPv4/IPv6';

export type ApnAuthType = 'None' | 'PAP' | 'CHAP' | 'PAP or CHAP';

export type ApnFocusTag = 'balanced' | 'speed' | 'gaming' | 'hotspot';

export interface ApnProfile {
  id: string;
  carrierId: CarrierId;
  name: string;
  apn: string;
  username: string;
  password: string;
  proxy: string;
  port: string;
  authType: ApnAuthType;
  apnType: string;
  protocol: ApnProtocol;
  roamingProtocol: ApnProtocol;
  bearer: string;
  mmsc?: string;
  mmsProxy?: string;
  mmsPort?: string;
  mcc?: string;
  mnc?: string;
  mvnoType?: string;
  focus: ApnFocusTag;
  isCustom?: boolean;
  isOfficialDefault?: boolean;
  /** Baseline theoretical speed rating (0..100) before empirical speedtest */
  estimatedSpeedScore: number;
  /** Baseline theoretical stability/ping rating (0..100) before empirical speedtest */
  estimatedStabilityScore: number;
  summary: string;
  bestFor: string;
}

export interface ApnBenchmarkStats {
  profile: ApnProfile;
  testCount: number;
  avgDownloadMbps: number | null;
  avgUploadMbps: number | null;
  avgPingMs: number | null;
  avgJitterMs: number | null;
  avgOverallScore: number | null;
  effectiveSpeedScore: number;
  effectiveStabilityScore: number;
  compositeRankScore: number;
}

export interface SpeedtestHistoryEntry {
  id: string;
  timestamp: string; // ISO string
  profileId: TestProfileId;
  downloadMbps: number;
  downloadPeakMbps: number;
  uploadMbps: number;
  uploadPeakMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  downloadLoadedMs: number | null;
  uploadLoadedMs: number | null;
  bufferbloatGrade: BufferbloatGrade;
  overallScore: number;
  gamingScore?: number;
  isp: string;
  asn?: string;
  ip: string;
  ipVersion?: string;
  connectionType?: string;
  city: string;
  coloCode: string;
  coloCity: string;
  downloadBytesUsed?: number;
  uploadBytesUsed?: number;
  totalBytesUsed: number;
  apnId?: string;
  apnName?: string;
  apnValue?: string;
  apnProtocol?: string;
  carrierId?: CarrierId;
  stageRole?: TestStageRole;
  chosenMode?: OptimizationModeChoice;
}
