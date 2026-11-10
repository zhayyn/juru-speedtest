import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Flame,
  Gamepad2,
  Lock,
  Radio,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type {
  ApnBenchmarkStats,
  ApnProfile,
  CarrierId,
  NetworkMeta,
  OptimizationModeChoice,
  SpeedUnit,
  SpeedtestHistoryEntry,
} from '../types/speedtest';
import {
  CARRIER_CATALOG,
  detectCarrierFromNetwork,
  downloadIosMobileConfig,
  formatApnParametersText,
  openAndroidApnSettingsScreen,
} from '../utils/apnDatabase';
import {
  buildViralShareWhatsAppUrl,
  downloadBeforeAfterCardPng,
  formatSpeed,
} from '../utils/networkDiagnostics';
import type { TrialQuotaStatus } from '../utils/plan';
import { MONETIZATION_CONFIG } from '../config/monetization-config';

interface BeforeAfterComparisonPanelProps {
  networkMeta: NetworkMeta | null;
  onRefreshNetworkMeta?: () => void;
  selectedCarrier: CarrierId;
  onSelectCarrier: (carrier: CarrierId) => void;
  fastestCandidate: ApnBenchmarkStats | null;
  mostStableCandidate: ApnBenchmarkStats | null;
  activeApnProfile: ApnProfile | null;
  chosenMode: OptimizationModeChoice;
  onChooseModeAndApn: (mode: OptimizationModeChoice, apnId: string) => void;
  baselineEntry: SpeedtestHistoryEntry | null;
  afterSpeedEntry: SpeedtestHistoryEntry | null;
  afterGamingEntry: SpeedtestHistoryEntry | null;
  latestAfterEntry: SpeedtestHistoryEntry | null;
  onResetBaseline: () => void;
  onStartSpeedtest: () => void;
  isRunning: boolean;
  unit: SpeedUnit;
  maskIp: boolean;
  trialStatus: TrialQuotaStatus;
  onOpenPricing: () => void;
  onClaimShareBonus?: () => void;
}

export const BeforeAfterComparisonPanel: React.FC<BeforeAfterComparisonPanelProps> = ({
  networkMeta,
  onRefreshNetworkMeta,
  selectedCarrier,
  onSelectCarrier,
  fastestCandidate,
  mostStableCandidate,
  activeApnProfile,
  chosenMode,
  onChooseModeAndApn,
  baselineEntry,
  afterSpeedEntry,
  afterGamingEntry,
  latestAfterEntry,
  onResetBaseline,
  onStartSpeedtest,
  isRunning,
  unit,
  maskIp,
  trialStatus,
  onOpenPricing,
  onClaimShareBonus,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [setupFeedback, setSetupFeedback] = useState<string | null>(null);
  const [selectedAfterTab, setSelectedAfterTab] = useState<'latest' | 'speed' | 'gaming'>('latest');

  // MMORPG Quest Adaptation State (0..100%)
  const [questProgress, setQuestProgress] = useState<number>(0);
  const [questScanning, setQuestScanning] = useState<boolean>(false);
  const [questAdaptedProfile, setQuestAdaptedProfile] = useState<ApnProfile | null>(null);
  const [preEquipIp, setPreEquipIp] = useState<string | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const triggerAdaptationScan = (profile: ApnProfile) => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
    }
    setQuestAdaptedProfile(profile);
    setQuestScanning(true);
    setQuestProgress(12);
    onRefreshNetworkMeta?.();

    let current = 12;
    scanTimerRef.current = window.setInterval(() => {
      current += Math.floor(Math.random() * 24) + 18;
      if (current >= 100) {
        current = 100;
        setQuestProgress(100);
        setQuestScanning(false);
        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
      } else {
        setQuestProgress(current);
      }
    }, 320);
  };

  // Auto-detect when user returns to app after equipping APN in Android Settings
  useEffect(() => {
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && questAdaptedProfile && questProgress < 100) {
        triggerAdaptationScan(questAdaptedProfile);
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [questAdaptedProfile, questProgress]);

  const detection = useMemo(() => detectCarrierFromNetwork(networkMeta), [networkMeta]);
  const carrierInfo = CARRIER_CATALOG[selectedCarrier];

  const displayedAfter = useMemo(() => {
    if (selectedAfterTab === 'speed' && afterSpeedEntry) return afterSpeedEntry;
    if (selectedAfterTab === 'gaming' && afterGamingEntry) return afterGamingEntry;
    return latestAfterEntry || afterSpeedEntry || afterGamingEntry || null;
  }, [selectedAfterTab, afterSpeedEntry, afterGamingEntry, latestAfterEntry]);

  const handleApplyRecommendedApn = async (
    mode: OptimizationModeChoice,
    profile: ApnProfile
  ) => {
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    setPreEquipIp(networkMeta?.ip || baselineEntry?.ip || null);
    onChooseModeAndApn(mode, profile.id);
    triggerAdaptationScan(profile);
    try {
      await navigator.clipboard.writeText(formatApnParametersText(profile));
      setCopiedId(profile.id);
      setTimeout(() => setCopiedId(null), 2400);
    } catch {
      // ignore clipboard errors
    }
    const { isAndroid } = openAndroidApnSettingsScreen();
    if (isAndroid) {
      setSetupFeedback(
        `Parameter "${profile.name}" (APN: ${profile.apn}) sudah disalin & Pengaturan APN Android dibuka! Setelah menyimpan APN baru, kembali ke halaman ini lalu tekan "Uji Kecepatan SESUDAH".`
      );
    } else {
      setSetupFeedback(
        `Parameter "${profile.name}" (APN: ${profile.apn}, Protokol: ${profile.protocol}) berhasil disalin! Pasang di Pengaturan Seluler -> Nama Titik Akses (APN) HP/Modem Anda, lalu tekan "Uji Kecepatan SESUDAH" untuk melihat perbandingan nyata.`
      );
    }
  };

  const handleCopyOnly = async (mode: OptimizationModeChoice, profile: ApnProfile) => {
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    setPreEquipIp(networkMeta?.ip || baselineEntry?.ip || null);
    onChooseModeAndApn(mode, profile.id);
    triggerAdaptationScan(profile);
    try {
      await navigator.clipboard.writeText(formatApnParametersText(profile));
      setCopiedId(profile.id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // ignore
    }
  };

  // Compute deltas when both baseline & displayedAfter exist
  const comparisonMetrics = useMemo(() => {
    if (!baselineEntry || !displayedAfter) return null;
    const dlDiff = displayedAfter.downloadMbps - baselineEntry.downloadMbps;
    const dlPct =
      baselineEntry.downloadMbps > 0
        ? Math.round((dlDiff / baselineEntry.downloadMbps) * 100)
        : 0;

    const ulDiff = displayedAfter.uploadMbps - baselineEntry.uploadMbps;
    const ulPct =
      baselineEntry.uploadMbps > 0
        ? Math.round((ulDiff / baselineEntry.uploadMbps) * 100)
        : 0;

    const pingDiff = displayedAfter.pingMs - baselineEntry.pingMs; // negative is better!
    const pingPct =
      baselineEntry.pingMs > 0
        ? Math.round((Math.abs(pingDiff) / baselineEntry.pingMs) * 100)
        : 0;

    const jitterDiff = displayedAfter.jitterMs - baselineEntry.jitterMs; // negative is better!

    const beforeGame = baselineEntry.gamingScore ?? baselineEntry.overallScore;
    const afterGame = displayedAfter.gamingScore ?? displayedAfter.overallScore;
    const gameDiff = afterGame - beforeGame;

    return {
      dlDiff,
      dlPct,
      ulDiff,
      ulPct,
      pingDiff,
      pingPct,
      jitterDiff,
      beforeGame,
      afterGame,
      gameDiff,
    };
  }, [baselineEntry, displayedAfter]);

  const step1Done = Boolean(baselineEntry);
  const step2Done = Boolean(baselineEntry && activeApnProfile);
  const step3Done = Boolean(baselineEntry && displayedAfter);

  const isSameDayAndNetworkAsBaseline = useMemo(() => {
    if (!baselineEntry) return false;
    const baseDate = new Date(baselineEntry.timestamp).toDateString();
    const todayDate = new Date().toDateString();
    if (baseDate !== todayDate) return false;
    if (networkMeta?.isp && baselineEntry.isp && networkMeta.isp !== baselineEntry.isp) {
      return false;
    }
    if (networkMeta?.city && baselineEntry.city && networkMeta.city !== baselineEntry.city) {
      return false;
    }
    return true;
  }, [baselineEntry, networkMeta]);

  const isDifferentAreaFromBaseline = useMemo(() => {
    if (!baselineEntry || !networkMeta) return false;
    return (
      (networkMeta.city && baselineEntry.city && networkMeta.city !== baselineEntry.city) ||
      (networkMeta.isp && baselineEntry.isp && networkMeta.isp !== baselineEntry.isp)
    );
  }, [baselineEntry, networkMeta]);

  return (
    <section className="mt-6 rounded-3xl border border-teal-500/35 bg-white p-5 shadow-sm sm:p-6 dark:border-teal-500/25 dark:bg-[#0C1221]">
      {/* Top Bar: Auto-Detected Network & Area + Free Trial Counter */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-teal-700 uppercase dark:text-teal-300">
              <Radio className="h-3.5 w-3.5" />
              Deteksi Area &amp; Rekomendasi APN Otomatis
            </span>

            {trialStatus.isPro ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                <Crown className="h-3 w-3" />
                PRO SELAMANYA AKTIF
              </span>
            ) : trialStatus.isTrialExhausted ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 hover:bg-amber-500/25 dark:text-amber-300"
              >
                <Lock className="h-3 w-3" />
                Kuota {MONETIZATION_CONFIG.freeTrialLimit}x Gratis Habis • Buka Pro {MONETIZATION_CONFIG.pricing.lifetimeLabel}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Sisa Kuota Hari Ini: {trialStatus.trialsRemaining}/{trialStatus.effectiveTrialLimit}x
              </span>
            )}
          </div>

          <h2 className="font-display text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
            Rekomendasi APN Terbaik di Area {networkMeta?.city || 'Anda Saat Ini'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Setiap lokasi punya kekuatan sinyal berbeda. Uji kecepatan di tempat Anda sekarang, lalu pasang APN yang paling pas!
          </p>
        </div>

        {/* Auto-Detected Active Network & Area Box */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-teal-500/30 bg-teal-500/[0.06] px-4 py-2.5 text-xs">
          <Smartphone className="h-4 w-4 shrink-0 text-teal-500" />
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
              <span>{carrierInfo.shortName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-teal-600 dark:text-teal-400">
                Area {networkMeta?.city || 'Indonesia'}
              </span>
            </div>
            <div className="font-mono-tabular text-[10px] text-slate-500 dark:text-slate-400">
              {networkMeta
                ? `${networkMeta.isp} (${networkMeta.ipVersion || 'IPv4'} • Server ${networkMeta.coloCode})`
                : 'Mendeteksi jaringan otomatis...'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Color-Coordinated Visual Journey */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            step: '1',
            title: 'Langkah 1 • Cek Kecepatan Awal',
            desc: baselineEntry
              ? `Terekam di ${baselineEntry.city}: ${formatSpeed(baselineEntry.downloadMbps, unit)} ${unit} • Ping ${Math.round(
                  baselineEntry.pingMs
                )} ms`
              : 'Rekam kecepatan & area jaringan yang sedang dipakai',
            done: step1Done,
            cardClass:
              'border-sky-500/45 bg-gradient-to-br from-sky-500/[0.11] via-sky-500/[0.04] to-transparent',
            badgeClass: 'bg-sky-500 text-white shadow-xs shadow-sky-500/30',
            titleClass: 'text-sky-900 dark:text-sky-200',
          },
          {
            step: '2',
            title: 'Langkah 2 • Pilih Cepat / Stabil',
            desc:
              chosenMode === 'gaming'
                ? `Mode Stabil Game (APN: ${activeApnProfile?.apn || ''})`
                : `Mode Cepat Download/Stream (APN: ${activeApnProfile?.apn || ''})`,
            done: step2Done && (questProgress === 100 || step3Done),
            cardClass:
              'border-indigo-500/45 bg-gradient-to-br from-indigo-500/[0.11] via-violet-500/[0.05] to-transparent',
            badgeClass: 'bg-indigo-500 text-white shadow-xs shadow-indigo-500/30',
            titleClass: 'text-indigo-900 dark:text-indigo-200',
          },
          {
            step: '3',
            title: 'Langkah 3 • Bandingkan Hasilnya',
            desc: displayedAfter
              ? `Sekarang: ${formatSpeed(displayedAfter.downloadMbps, unit)} ${unit} • Ping ${Math.round(
                  displayedAfter.pingMs
                )} ms`
              : 'Pasang APN lalu bandingkan dengan kecepatan tadi',
            done: step3Done,
            cardClass:
              'border-emerald-500/45 bg-gradient-to-br from-emerald-500/[0.11] via-teal-500/[0.05] to-transparent',
            badgeClass: 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30',
            titleClass: 'text-emerald-900 dark:text-emerald-200',
          },
        ].map(item => (
          <div
            key={item.step}
            className={`flex items-start gap-2.5 rounded-2xl border-2 p-3.5 transition ${item.cardClass}`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${item.badgeClass}`}
            >
              {item.done ? <Check className="h-3.5 w-3.5" /> : item.step}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-extrabold ${item.titleClass}`}>
                {item.title}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1 Panel — Serasi dengan Warna Langkah 1 (Sky Blue) */}
      {!baselineEntry ? (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border-2 border-sky-500/45 bg-gradient-to-r from-sky-500/12 via-sky-500/5 to-transparent p-4 sm:flex-row sm:items-center">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-sky-800 uppercase dark:text-sky-300">
              Langkah 1 • Rekam Kondisi Sekarang
            </div>
            <div className="mt-1 text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">
              Cek &amp; Rekam Kecepatan Jaringan Anda di {networkMeta?.city || 'Area Ini'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Rekaman awal di <strong>{networkMeta?.city || 'area ini'}</strong> tidak mengurangi kuota 9x selama Anda masih di jaringan &amp; hari yang sama.
            </p>
          </div>
          <button
            type="button"
            disabled={isRunning}
            onClick={onStartSpeedtest}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-sky-500/25 transition hover:bg-sky-500 disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            <span>{isRunning ? 'Sedang Menguji...' : 'Mulai Cek Kecepatan Sekarang'}</span>
          </button>
        </div>
      ) : isDifferentAreaFromBaseline ? (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border-2 border-sky-500/45 bg-sky-500/10 p-4 sm:flex-row sm:items-center">
          <div className="space-y-0.5">
            <div className="text-xs font-extrabold text-sky-900 dark:text-sky-300">
              📍 Anda Berpindah Area / Jaringan ({baselineEntry.city} &rarr; {networkMeta?.city})
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Beda tempat, beda kualitas sinyal! Rekam ulang kecepatan di lokasi baru ini untuk mendapatkan perbandingan APN yang akurat.
            </p>
          </div>
          <button
            type="button"
            disabled={isRunning}
            onClick={() => {
              onResetBaseline();
              onStartSpeedtest();
            }}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-sky-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Cek Area Baru Ini</span>
          </button>
        </div>
      ) : isSameDayAndNetworkAsBaseline && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-500/35 bg-sky-500/[0.08] px-4 py-2.5 text-xs">
          <span className="font-semibold text-sky-900 dark:text-sky-200">
            ✓ Langkah 1 Selesai: Jaringan <strong>{baselineEntry.isp} ({baselineEntry.city})</strong> hari ini sudah terekam ({formatSpeed(baselineEntry.downloadMbps, unit)} {unit} • Ping {Math.round(baselineEntry.pingMs)} ms) — tidak perlu tes awal lagi!
          </span>
          <button
            type="button"
            onClick={onResetBaseline}
            className="cursor-pointer font-bold text-sky-700 hover:underline dark:text-sky-300"
          >
            Rekam Ulang Area
          </button>
        </div>
      )}

      {/* Setup Copy/Intent Notification */}
      {setupFeedback && (
        <div className="mt-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-3.5 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-start justify-between gap-3">
            <span>{setupFeedback}</span>
            <button
              type="button"
              onClick={() => setSetupFeedback(null)}
              className="cursor-pointer font-bold text-indigo-600 hover:underline dark:text-indigo-300"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2 PANEL — SERASI DENGAN WARNA LANGKAH 2 (INDIGO / VIOLET)      */}
      {/* =================================================================== */}
      {fastestCandidate && mostStableCandidate && (
        <div className="mt-5 rounded-2xl border-2 border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.06] via-violet-500/[0.03] to-transparent p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-indigo-800 uppercase dark:text-indigo-300">
                Langkah 2 • Pilih Fokus Optimasi APN
              </span>
              <h3 className="mt-1 font-display text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                Mau Pakai yang Cepat atau yang Stabil?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih sesuai kebutuhan Anda di lokasi ini, lalu salin &amp; terapkan di HP:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* OPTION A: APN TERCEPAT (MAX SPEED) */}
            <div
              className={`flex flex-col justify-between rounded-2xl border-2 p-4 transition-all ${
                chosenMode === 'speed' && activeApnProfile?.id === fastestCandidate.profile.id
                  ? 'border-teal-500 bg-teal-500/[0.07] shadow-md shadow-teal-500/10'
                  : 'border-slate-200 bg-slate-50/50 hover:border-teal-500/40 dark:border-slate-800 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/15 px-2.5 py-1 text-[11px] font-extrabold text-teal-700 uppercase dark:text-teal-300">
                    <Flame className="h-3.5 w-3.5" />
                    Opsi 1 • Mode Cepat (Download &amp; Streaming)
                  </span>
                  {chosenMode === 'speed' &&
                    activeApnProfile?.id === fastestCandidate.profile.id && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aktif Dipilih
                      </span>
                    )}
                </div>

                <h4 className="mt-2.5 font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {fastestCandidate.profile.name}
                </h4>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono-tabular text-[11px]">
                  <span className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-bold text-teal-700 dark:text-teal-300">
                    APN: {trialStatus.canUsePremiumFeatures || fastestCandidate.profile.isOfficialDefault
                      ? fastestCandidate.profile.apn
                      : '••••••'}
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {fastestCandidate.profile.protocol}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  ⚡ <strong>Fokus Kecepatan:</strong> Membuka jalur tanpa proxy agar <strong>download file besar, YouTube 4K, &amp; TikTok HD</strong> makin ngebut.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyRecommendedApn('speed', fastestCandidate.profile)
                  }
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-teal-500"
                >
                  {!trialStatus.canUsePremiumFeatures ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  <span>Salin &amp; Terapkan APN Cepat</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyOnly('speed', fastestCandidate.profile)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-teal-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {copiedId === fastestCandidate.profile.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!trialStatus.canUsePremiumFeatures) {
                      onOpenPricing();
                      return;
                    }
                    onChooseModeAndApn('speed', fastestCandidate.profile.id);
                    downloadIosMobileConfig(fastestCandidate.profile);
                  }}
                  title="Unduh Profil iOS (.mobileconfig)"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-teal-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>iOS</span>
                </button>
              </div>
            </div>

            {/* OPTION B: APN TERSTABIL UNTUK MAIN GAME */}
            <div
              className={`flex flex-col justify-between rounded-2xl border-2 p-4 transition-all ${
                chosenMode === 'gaming' && activeApnProfile?.id === mostStableCandidate.profile.id
                  ? 'border-violet-500 bg-violet-500/[0.08] shadow-md shadow-violet-500/10'
                  : 'border-slate-200 bg-slate-50/50 hover:border-violet-500/40 dark:border-slate-800 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-2.5 py-1 text-[11px] font-extrabold text-violet-700 uppercase dark:text-violet-300">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    Opsi 2 • Mode Stabil (Gaming &amp; Anti-Lag)
                  </span>
                  {chosenMode === 'gaming' &&
                    activeApnProfile?.id === mostStableCandidate.profile.id && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-violet-600 dark:text-violet-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aktif Dipilih
                      </span>
                    )}
                </div>

                <h4 className="mt-2.5 font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {mostStableCandidate.profile.name}
                </h4>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono-tabular text-[11px]">
                  <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-bold text-violet-700 dark:text-violet-300">
                    APN: {trialStatus.canUsePremiumFeatures
                      ? mostStableCandidate.profile.apn
                      : '••••••'}
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {mostStableCandidate.profile.protocol} Murni
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  🎮 <strong>Fokus Ping Kecil:</strong> Mengunci jalur IPv4 &amp; sinyal 4G LTE agar <strong>ping hijau rata dan tidak patah-patah</strong> saat main game.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyRecommendedApn('gaming', mostStableCandidate.profile)
                  }
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-violet-500"
                >
                  {!trialStatus.canUsePremiumFeatures ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Shield className="h-3.5 w-3.5" />
                  )}
                  <span>Salin &amp; Terapkan APN Stabil</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyOnly('gaming', mostStableCandidate.profile)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {copiedId === mostStableCandidate.profile.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!trialStatus.canUsePremiumFeatures) {
                      onOpenPricing();
                      return;
                    }
                    onChooseModeAndApn('gaming', mostStableCandidate.profile.id);
                    downloadIosMobileConfig(mostStableCandidate.profile);
                  }}
                  title="Unduh Profil iOS (.mobileconfig)"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>iOS</span>
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* STEP 3 PANEL — SERASI DENGAN WARNA LANGKAH 3 (EMERALD GREEN)        */}
          {/* =================================================================== */}
          {(questAdaptedProfile || baselineEntry) && (
            <div
              className={`mt-4 overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 ${
                questProgress === 100
                  ? 'border-emerald-500/80 bg-gradient-to-r from-emerald-500/18 via-teal-500/10 to-amber-500/10 shadow-lg shadow-emerald-500/15'
                  : 'border-emerald-500/45 bg-gradient-to-r from-emerald-500/12 via-teal-500/5 to-transparent'
              }`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                        questProgress === 100
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40'
                          : questScanning
                          ? 'animate-pulse bg-amber-500 text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {questProgress === 100 ? (
                        <>
                          <Award className="h-3.5 w-3.5" />
                          <span>LANGKAH 3 • 100% APN ADAPTED!</span>
                        </>
                      ) : questScanning ? (
                        <>
                          <Swords className="h-3.5 w-3.5" />
                          <span>MEMINDAI ADAPTASI APN BARU... {questProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Swords className="h-3.5 w-3.5" />
                          <span>LANGKAH 3 • SIAP BANDINGKAN HASILNYA</span>
                        </>
                      )}
                    </span>

                    {questProgress === 100 && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 font-mono-tabular text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        APN AKTIF: {(questAdaptedProfile || activeApnProfile)?.apn} ({(questAdaptedProfile || activeApnProfile)?.protocol})
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">
                    {questProgress === 100 ? (
                      <>
                        🎉 Mantap! APN{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {(questAdaptedProfile || activeApnProfile)?.name}
                        </span>{' '}
                        Sudah Siap (100% Adapted)
                      </>
                    ) : (
                      <>
                        Sudah menerapkan APN{' '}
                        <span className="text-teal-600 dark:text-teal-400">
                          {(questAdaptedProfile || activeApnProfile)?.name || 'Pilihan Anda'}
                        </span>{' '}
                        di pengaturan HP?
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {questProgress === 100 ? (
                      <>
                        Target APN{' '}
                        <strong className="font-mono-tabular">
                          {(questAdaptedProfile || activeApnProfile)?.apn}
                        </strong>
                        {preEquipIp && networkMeta?.ip && preEquipIp !== networkMeta.ip
                          ? ` • IP baru terdeteksi (${networkMeta.ip})!`
                          : ' • Siap diadu dengan kecepatan awal tadi.'}{' '}
                        Klik tombol di kanan untuk melihat perbedaannya!
                      </>
                    ) : (
                      <>
                        Setelah mengganti APN di HP, klik tombol di kanan untuk langsung membandingkan hasilnya!
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {questProgress < 100 && activeApnProfile && (
                    <button
                      type="button"
                      onClick={() => triggerAdaptationScan(activeApnProfile)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-500/25 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sudah Ganti APN (100% Adapted)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={onStartSpeedtest}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-60 ${
                      questProgress === 100
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-teal-600 to-sky-600'
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    <span>
                      {isRunning
                        ? 'Sedang Menguji...'
                        : 'Bandingkan dengan yang Sekarang'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Animated Adaptation Progress Bar (0% -> 100%) */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-mono-tabular text-[10px] font-bold">
                  <span className="text-slate-500 dark:text-slate-400">
                    STATUS ADAPTASI APN BARU DI PERANGKAT
                  </span>
                  <span
                    className={
                      questProgress === 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-teal-600 dark:text-teal-400'
                    }
                  >
                    {questProgress}% ADAPTED
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    style={{ width: `${Math.max(8, questProgress)}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      questProgress === 100
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400'
                        : 'bg-gradient-to-r from-teal-500 to-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* BEFORE VS AFTER EMPIRICAL COMPARISON BOARD                          */}
      {/* =================================================================== */}
      {baselineEntry && displayedAfter && comparisonMetrics && (
        <div className="mt-6 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.07] via-teal-500/[0.04] to-transparent p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Hasil Perbandingan Nyata • Sebelum vs Sesudah
              </span>
              <h3 className="mt-1 font-display text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                Bukti Perbedaan Performa Jaringan Anda
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {afterSpeedEntry && afterGamingEntry && (
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-[11px] font-bold dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setSelectedAfterTab('speed')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 transition ${
                      displayedAfter.id === afterSpeedEntry.id
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    vs Mode Cepat
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAfterTab('gaming')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 transition ${
                      displayedAfter.id === afterGamingEntry.id
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    vs Stabil Game
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!trialStatus.canUsePremiumFeatures) {
                    onOpenPricing();
                    return;
                  }
                  downloadBeforeAfterCardPng(baselineEntry, displayedAfter, maskIp);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Bukti PNG</span>
              </button>

              <a
                href={buildViralShareWhatsAppUrl(baselineEntry, displayedAfter)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClaimShareBonus?.()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-500/25 dark:text-emerald-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>
                  {trialStatus.canClaimShareBonus
                    ? 'Bagikan ke WA (+1 Uji Gratis)'
                    : 'Bagikan ke WA'}
                </span>
              </a>

              <button
                type="button"
                onClick={onResetBaseline}
                title="Atur ulang data Sebelum jika Anda mengganti kartu SIM atau berpindah lokasi"
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Awal</span>
              </button>
            </div>
          </div>

          {/* Before vs After Columns */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Column 1: SEBELUM */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
                  SEBELUM OPTIMASI (AWAL)
                </span>
                <span className="font-mono-tabular text-[11px] text-slate-400">
                  APN: {baselineEntry.apnValue || 'Default'}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                {baselineEntry.apnName || 'Konfigurasi Awal Jaringan'}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2.5 font-mono-tabular">
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <span className="block text-[10px] text-slate-400">Download</span>
                  <strong className="text-lg text-slate-800 dark:text-slate-200">
                    {formatSpeed(baselineEntry.downloadMbps, unit)} {unit}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <span className="block text-[10px] text-slate-400">Upload</span>
                  <strong className="text-lg text-slate-800 dark:text-slate-200">
                    {formatSpeed(baselineEntry.uploadMbps, unit)} {unit}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <span className="block text-[10px] text-slate-400">Ping Dasar</span>
                  <strong className="text-base text-slate-800 dark:text-slate-200">
                    {Math.round(baselineEntry.pingMs)} ms
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <span className="block text-[10px] text-slate-400">Jitter &amp; Skor Game</span>
                  <strong className="text-base text-slate-800 dark:text-slate-200">
                    ±{baselineEntry.jitterMs.toFixed(1)} ms • {comparisonMetrics.beforeGame}/100
                  </strong>
                </div>
              </div>
            </div>

            {/* Column 2: SESUDAH */}
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-white p-4 shadow-xs dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase dark:text-emerald-300">
                  SESUDAH •{' '}
                  {displayedAfter.chosenMode === 'gaming'
                    ? 'MODE STABIL GAME'
                    : 'MODE TERCEPAT'}
                </span>
                <span className="font-mono-tabular text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  APN: {displayedAfter.apnValue || 'Optimasi'}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white">
                {displayedAfter.apnName || 'APN Rekomendasi Juru'}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2.5 font-mono-tabular">
                <div className="rounded-xl bg-emerald-500/[0.07] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Download</span>
                    {comparisonMetrics.dlDiff !== 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ${
                          comparisonMetrics.dlDiff > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {comparisonMetrics.dlDiff > 0 ? '+' : ''}
                        {comparisonMetrics.dlPct}%
                      </span>
                    )}
                  </div>
                  <strong className="text-lg text-emerald-700 dark:text-emerald-300">
                    {formatSpeed(displayedAfter.downloadMbps, unit)} {unit}
                  </strong>
                </div>

                <div className="rounded-xl bg-sky-500/[0.07] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Upload</span>
                    {comparisonMetrics.ulDiff !== 0 && (
                      <span
                        className={`text-[10px] font-extrabold ${
                          comparisonMetrics.ulDiff > 0
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {comparisonMetrics.ulDiff > 0 ? '+' : ''}
                        {comparisonMetrics.ulPct}%
                      </span>
                    )}
                  </div>
                  <strong className="text-lg text-sky-700 dark:text-sky-300">
                    {formatSpeed(displayedAfter.uploadMbps, unit)} {unit}
                  </strong>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Ping Dasar</span>
                    {comparisonMetrics.pingDiff !== 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ${
                          comparisonMetrics.pingDiff < 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <TrendingDown className="h-3 w-3" />
                        {comparisonMetrics.pingDiff < 0
                          ? `${Math.round(comparisonMetrics.pingDiff)} ms`
                          : `+${Math.round(comparisonMetrics.pingDiff)} ms`}
                      </span>
                    )}
                  </div>
                  <strong className="text-base text-slate-900 dark:text-white">
                    {Math.round(displayedAfter.pingMs)} ms
                  </strong>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Jitter &amp; Skor Game
                    </span>
                    {comparisonMetrics.gameDiff !== 0 && (
                      <span
                        className={`text-[10px] font-extrabold ${
                          comparisonMetrics.gameDiff > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {comparisonMetrics.gameDiff > 0 ? '+' : ''}
                        {comparisonMetrics.gameDiff} poin
                      </span>
                    )}
                  </div>
                  <strong className="text-base text-slate-900 dark:text-white">
                    ±{displayedAfter.jitterMs.toFixed(1)} ms • {comparisonMetrics.afterGame}/100
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Banner when 3x Free Trials Have Been Experienced! */}
      {!trialStatus.isPro && trialStatus.isTrialExhausted && (
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-transparent p-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 uppercase dark:text-amber-300">
              <Crown className="h-4 w-4" />
              <span>{MONETIZATION_CONFIG.freeTrialLimit}x Uji Coba Gratis Selesai — Sudah Merasakan Perbedaannya?</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              Buka seluruh fitur <strong>Juru Speedtest + Semua Database &amp; Racikan APN Operator Indonesia + Unlimited Uji Sebelum/Sesudah + 100% Bebas Iklan</strong> hanya{' '}
              <strong className="text-teal-700 dark:text-emerald-300">
                {MONETIZATION_CONFIG.pricing.lifetimeLabel} sekali bayar untuk selamanya!
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trialStatus.canClaimShareBonus && (
              <a
                href={buildViralShareWhatsAppUrl(baselineEntry, displayedAfter)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClaimShareBonus?.()}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-4 py-3 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-500/25 dark:text-emerald-300"
              >
                <Sparkles className="h-4 w-4" />
                <span>Share WA (+1 Uji Gratis)</span>
              </a>
            )}
            <button
              type="button"
              onClick={onOpenPricing}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-md transition hover:bg-amber-400"
            >
              <Crown className="h-4 w-4" />
              <span>Buka Selamanya {MONETIZATION_CONFIG.pricing.lifetimeLabel}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

