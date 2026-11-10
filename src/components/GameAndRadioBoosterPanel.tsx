import React, { useEffect, useState } from 'react';
import {
  Activity,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gamepad2,
  Globe,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import type {
  CarrierId,
  DnsBenchmarkResult,
  DnsProviderTarget,
  GameServerProbeResult,
} from '../types/speedtest';
import { CARRIER_CATALOG } from '../utils/apnDatabase';
import {
  benchmarkDnsProviders,
  CARRIER_LTE_BAND_GUIDES,
  DNS_PROVIDER_TARGETS,
  estimateGameServersFromBaseLatency,
  openAndroidPrivateDnsSettings,
  probeAllGameServers,
  triggerAndroidRadioLockMenu,
} from '../utils/gameAndRadioTools';
import type { TrialQuotaStatus } from '../utils/plan';

interface GameAndRadioBoosterPanelProps {
  selectedCarrier: CarrierId;
  onSelectCarrier: (carrier: CarrierId) => void;
  basePingMs: number;
  baseJitterMs: number;
  trialStatus: TrialQuotaStatus;
  onOpenPricing: () => void;
}

type BoosterTab = 'game_radar' | 'private_dns' | 'lte_band_lock';

export const GameAndRadioBoosterPanel: React.FC<GameAndRadioBoosterPanelProps> = ({
  selectedCarrier,
  onSelectCarrier,
  basePingMs,
  baseJitterMs,
  trialStatus,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<BoosterTab>('game_radar');

  // Game Ping Radar state
  const [gameResults, setGameResults] = useState<GameServerProbeResult[]>(() =>
    estimateGameServersFromBaseLatency(basePingMs, baseJitterMs)
  );
  const [isProbingGames, setIsProbingGames] = useState(false);
  const [probeProgress, setProbeProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 6,
  });

  // DNS Benchmark state
  const [dnsRanks, setDnsRanks] = useState<DnsBenchmarkResult[]>(() =>
    DNS_PROVIDER_TARGETS.map((provider, i) => ({
      provider,
      latencyMs: 18 + i * 5,
      rank: i + 1,
    }))
  );
  const [hasTestedDnsLive, setHasTestedDnsLive] = useState(false);
  const [isTestingDns, setIsTestingDns] = useState(false);
  const [copiedDnsId, setCopiedDnsId] = useState<string | null>(null);

  // Radio / Band lock state
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [copiedDialCode, setCopiedDialCode] = useState(false);

  // Re-sync baseline game estimates when speedtest ping updates (unless user already ran a live probe)
  useEffect(() => {
    setGameResults(prev => {
      if (prev.some(r => r.isLiveProbe)) return prev;
      return estimateGameServersFromBaseLatency(basePingMs, baseJitterMs);
    });
  }, [basePingMs, baseJitterMs]);

  const handleRunLiveGameProbe = async () => {
    if (isProbingGames) return;
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    setIsProbingGames(true);
    setProbeProgress({ done: 0, total: 6 });
    try {
      const results = await probeAllGameServers(basePingMs, (done, total, partial) => {
        setProbeProgress({ done, total });
        if (partial.length > 0) {
          setGameResults(prev => {
            const map = new Map(partial.map(item => [item.target.id, item]));
            return prev.map(old => map.get(old.target.id) || old);
          });
        }
      });
      setGameResults(results);
    } finally {
      setIsProbingGames(false);
    }
  };

  const handleRunDnsBenchmark = async () => {
    if (isTestingDns) return;
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    setIsTestingDns(true);
    try {
      const ranked = await benchmarkDnsProviders();
      setDnsRanks(ranked);
      setHasTestedDnsLive(true);
    } finally {
      setIsTestingDns(false);
    }
  };

  const handleApplyPrivateDns = async (provider: DnsProviderTarget) => {
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    try {
      await navigator.clipboard.writeText(provider.androidPrivateDnsHost);
      setCopiedDnsId(provider.id);
      setTimeout(() => setCopiedDnsId(null), 2400);
    } catch {
      // ignore clipboard error
    }
    const { isAndroid } = openAndroidPrivateDnsSettings();
    setActionToast(
      isAndroid
        ? `Hostname DNS Pribadi "${provider.androidPrivateDnsHost}" telah disalin! Membuka Pengaturan Jaringan Android — pilih "DNS Pribadi (Private DNS)" lalu tempel hostname tersebut.`
        : `Hostname DNS Pribadi "${provider.androidPrivateDnsHost}" (IP: ${provider.primaryIp} / ${provider.secondaryIp}) telah disalin! Buka Pengaturan Jaringan -> DNS Pribadi di HP Android atau menu DNS di Router Wi-Fi Anda lalu tempel.`
    );
  };

  const handleTriggerRadioLock = async () => {
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    const { isAndroid } = await triggerAndroidRadioLockMenu();
    setCopiedDialCode(true);
    setTimeout(() => setCopiedDialCode(false), 2500);
    setActionToast(
      isAndroid
        ? 'Kode rahasia *#*#4636#*#* telah disalin & membuka Dialer Android! Pilih "Informasi Telepon (Phone Information)" -> ubah "Setel Jenis Jaringan yang Disukai" ke "LTE Only" (4G Murni) atau "NR/LTE" (4G/5G).'
        : 'Kode rahasia *#*#4636#*#* telah disalin ke papan klip! Buka aplikasi Telepon (Dialer) di HP Android Anda, tempel kode tersebut, lalu pilih "Informasi Telepon" -> "LTE Only" atau "NR/LTE".'
    );
  };

  const bandGuide = CARRIER_LTE_BAND_GUIDES[selectedCarrier];
  const greenGamesCount = gameResults.filter(g => g.status === 'excellent').length;

  return (
    <section className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800/90 dark:bg-[#0C1221]">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-violet-700 uppercase dark:text-violet-300">
              <Gamepad2 className="h-3.5 w-3.5" />
              Radar Ping Game, Private DNS &amp; Kunci 4G/5G
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
              <Sparkles className="h-3 w-3" />
              Alat Harian Gamer &amp; Pemburu Sinyal Indonesia
            </span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
            Cek Ping Server Game Sebelum Main, Optimasi DNS &amp; Kunci Band LTE
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pastikan server game hijau sebelum <em>push rank</em>, percepat resolusi domain dengan Private DNS, dan cegah sinyal turun ke H+/3G.
          </p>
        </div>

        {/* 3 Mode Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/90 p-1 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setActiveTab('game_radar')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === 'game_radar'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Radar Ping Game</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('private_dns')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === 'private_dns'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Private DNS Cepat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lte_band_lock')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              activeTab === 'lte_band_lock'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Kunci 4G/5G &amp; Band LTE</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {actionToast && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-teal-500/40 bg-teal-500/10 p-3.5 text-xs text-teal-900 dark:text-teal-200">
          <div className="flex items-start gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="cursor-pointer text-teal-600 hover:text-teal-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: RADAR PING SERVER GAME INDONESIA & ASIA TENGGARA               */}
      {/* ===================================================================== */}
      {activeTab === 'game_radar' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-sky-500/5 to-transparent p-4 sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-violet-700 dark:text-violet-300">
                <Activity className="h-4 w-4" />
                <span>
                  Status Kesiapan Match Saat Ini: {greenGamesCount} dari {gameResults.length} Klaster Game Hijau
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {gameResults.some(g => g.isLiveProbe)
                  ? 'Hasil di bawah adalah pengukuran RTT Live langsung dari perangkat Anda ke klaster edge game.'
                  : 'Tekan tombol "Pindai Ping Semua Game" untuk mengetes koneksi live ke server MLBB, PUBGM, FF, dan Valorant sebelum mulai match.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isProbingGames}
              onClick={handleRunLiveGameProbe}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {isProbingGames ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Memindai ({probeProgress.done}/{probeProgress.total})...
                  </span>
                </>
              ) : !trialStatus.canUsePremiumFeatures ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Pindai Live ({MONETIZATION_CONFIG.pricing.lifetimeLabel})</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Pindai Ping Semua Game Sekarang</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {gameResults.map(item => {
              const badgeColor =
                item.status === 'excellent'
                  ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : item.status === 'good'
                  ? 'border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-300';

              const dotColor =
                item.status === 'excellent'
                  ? 'bg-emerald-500'
                  : item.status === 'good'
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

              return (
                <div
                  key={item.target.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 transition hover:border-violet-500/40 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.target.genreTag} • {item.target.regionLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${badgeColor}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        {item.statusLabel}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.target.shortName}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.target.publisher}
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-end justify-between border-t border-slate-200/70 pt-3 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                        Ping ke {item.target.serverCity}
                      </span>
                      <div className="mt-0.5 flex items-baseline gap-1.5 font-mono-tabular">
                        <span
                          className={`text-xl font-extrabold ${
                            item.status === 'excellent'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.status === 'good'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.pingMs} ms
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Jitter ±{item.jitterMs} ms
                        </span>
                      </div>
                    </div>

                    <span className="rounded-lg bg-slate-200/60 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                      {item.isLiveProbe ? 'Live RTT' : 'Estimasi'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PRIVATE DNS OPTIMIZER (DoT / DoH)                              */}
      {/* ===================================================================== */}
      {activeTab === 'private_dns' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent p-4 sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-teal-700 dark:text-teal-300">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {hasTestedDnsLive
                    ? `Pemenang DNS Tercepat di Jaringan Anda: ${dnsRanks[0]?.provider.name} (${dnsRanks[0]?.latencyMs} ms)`
                    : 'Optimasi Resolusi Domain untuk Seluler & Wi-Fi Rumah'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Mengaktifkan <strong>Private DNS (DNS Pribadi)</strong> di Android 9+ mempercepat koneksi awal aplikasi, menstabilkan rute CDN game, dan bekerja baik di Kartu SIM maupun Wi-Fi.
              </p>
            </div>

            <button
              type="button"
              disabled={isTestingDns}
              onClick={handleRunDnsBenchmark}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-60"
            >
              {isTestingDns ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menguji Kecepatan DNS...</span>
                </>
              ) : !trialStatus.canUsePremiumFeatures ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Uji DNS Tercepat ({MONETIZATION_CONFIG.pricing.lifetimeLabel})</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Uji DNS Tercepat Sekarang</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {dnsRanks.map(item => {
              const { provider } = item;
              const isWinner = item.rank === 1;
              return (
                <div
                  key={provider.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                    isWinner
                      ? 'border-teal-500 bg-teal-500/[0.05] ring-1 ring-teal-500/25'
                      : 'border-slate-200/90 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/45'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isWinner && (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                            #1 DNS TERCEPAT
                          </span>
                        )}
                        <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {provider.badge}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        {item.latencyMs} ms
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {provider.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono-tabular text-[11px]">
                      <span className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 font-bold text-teal-700 dark:text-teal-300">
                        Host Android: {provider.androidPrivateDnsHost}
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        IPv4: {provider.primaryIp} / {provider.secondaryIp}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleApplyPrivateDns(provider)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      {copiedDnsId === provider.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Hostname Disalin!</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Salin Host &amp; Pasang di Android</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(provider.androidPrivateDnsHost);
                          setCopiedDnsId(provider.id);
                          setTimeout(() => setCopiedDnsId(null), 2200);
                        } catch {
                          // ignore
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Saja</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: KUNCI SINYAL 4G/5G (*#*#4636#*#*) & CONTEKAN BAND LTE          */}
      {/* ===================================================================== */}
      {activeTab === 'lte_band_lock' && (
        <div className="mt-5 space-y-4">
          {/* Carrier Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Pilih Operator:
            </span>
            {(Object.keys(CARRIER_CATALOG) as CarrierId[]).map(cid => {
              const c = CARRIER_CATALOG[cid];
              const active = cid === selectedCarrier;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => onSelectCarrier(cid)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full bg-current ${c.accentClass}`} />
                  <span>{c.shortName}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 7 cols: Band Frequency Cheat Sheet */}
            <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider text-sky-600 uppercase dark:text-sky-400">
                    Peta Frekuensi Radio • MCC/MNC {CARRIER_CATALOG[selectedCarrier].mccMnc}
                  </span>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Contekan Pita Frekuensi (Band LTE &amp; 5G) {CARRIER_CATALOG[selectedCarrier].name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-500/25 bg-white p-3 dark:bg-slate-950/70">
                  <span className="text-[10px] font-extrabold text-teal-600 uppercase dark:text-teal-400">
                    ⚡ Band Kecepatan Unduh Puncak
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {bandGuide.speedBands}
                  </p>
                </div>

                <div className="rounded-xl border border-violet-500/25 bg-white p-3 dark:bg-slate-950/70">
                  <span className="text-[10px] font-extrabold text-violet-600 uppercase dark:text-violet-400">
                    🎮 Band Ping Stabil Main Game
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {bandGuide.gamingStableBands}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-500/25 bg-white p-3 dark:bg-slate-950/70">
                  <span className="text-[10px] font-extrabold text-sky-600 uppercase dark:text-sky-400">
                    🏠 Band Tembus Dinding / Indoor
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {bandGuide.indoorCoverageBands}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-white p-3 dark:bg-slate-950/70">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase dark:text-amber-400">
                    🚀 Spektrum 5G NR / Carrier Aggregation
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {bandGuide.fiveGBands}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-950 dark:text-sky-200">
                <strong>💡 Rekomendasi Teknisi Juru:</strong> {bandGuide.lockRecommendation}
              </div>
            </div>

            {/* Right 5 cols: *#*#4636#*#* 4G/5G Lock Action Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-sky-500/35 bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-transparent p-4 lg:col-span-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 px-2.5 py-1 text-[10px] font-extrabold text-sky-700 uppercase dark:text-sky-300">
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Anti-Turun ke 3G / H+ Saat War</span>
                </div>

                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Kunci Radio HP di &ldquo;LTE Only&rdquo; atau &ldquo;NR/LTE&rdquo;
                </h3>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Saat sinyal 4G melemah di dalam ruangan, HP otomatis berpindah (*handover*) ke 3G/H+ yang menyebabkan <strong>lag merah 3–5 detik di dalam game</strong>. Mengunci jaringan di <code>LTE Only</code> atau <code>NR/LTE</code> memaksa modem tetap di jalur 4G/5G.
                </p>

                <ol className="list-inside list-decimal space-y-1 rounded-xl border border-slate-200/80 bg-white/80 p-3 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  <li>
                    Tekan tombol di bawah untuk menyalin kode <code>*#*#4636#*#*</code> &amp; membuka Dialer Android.
                  </li>
                  <li>
                    Pilih <strong>Informasi Telepon (Phone Information)</strong> untuk SIM 1 atau SIM 2.
                  </li>
                  <li>
                    Pada <em>Setel Jenis Jaringan yang Disukai</em>, pilih <strong>LTE Only</strong> (khusus 4G) atau <strong>NR/LTE</strong> (4G+5G).
                  </li>
                </ol>

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  *Catatan: Saat mode <code>LTE Only</code> aktif, panggilan telepon seluler reguler (non-WhatsApp) memerlukan fitur VoLTE aktif. Kembalikan ke <code>NR/LTE/GSM/WCDMA</code> bila ingin menerima telepon biasa.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerRadioLock}
                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-500"
              >
                {copiedDialCode ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Kode *#*#4636#*#* Disalin &amp; Membuka Menu!</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Salin *#*#4636#*#* &amp; Buka Menu Kunci 4G/5G</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

