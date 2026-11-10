import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Download,
  ExternalLink,
  History,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from './config/monetization-config';
import { ApnOptimizerLab } from './components/ApnOptimizerLab';
import { BeforeAfterComparisonPanel } from './components/BeforeAfterComparisonPanel';
import { GameAndRadioBoosterPanel } from './components/GameAndRadioBoosterPanel';
import { Header } from './components/Header';
import { HistoryAndSharePanel } from './components/HistoryAndSharePanel';
import {
  LEGAL_PAGE_ROUTES,
  LegalCompliancePages,
  resolveLegalSlugFromPathname,
  type LegalPageSlug,
} from './components/LegalCompliancePages';
import { LiveThroughputChart } from './components/LiveThroughputChart';
import { MonetizationAdBanner } from './components/MonetizationAdBanner';
import { NetworkDiagnosticsSection } from './components/NetworkDiagnosticsSection';
import { PricingModal } from './components/PricingModal';
import { SiteFooter } from './components/SiteFooter';
import { SpeedometerGauge } from './components/SpeedometerGauge';
import { useAccount } from './hooks/useAccount';
import {
  createInitialLiveState,
  fetchNetworkMetadata,
  runFullSpeedtest,
} from './services/speedtestEngine';
import type {
  ApnProfile,
  CarrierId,
  OptimizationModeChoice,
  SpeedUnit,
  SpeedtestHistoryEntry,
  SpeedtestLiveState,
  TestProfileId,
  TestStageRole,
} from './types/speedtest';
import {
  detectCarrierFromNetwork,
  evaluateAndRankApns,
  normalizeCarrierId,
  PRESET_APN_PROFILES,
} from './utils/apnDatabase';
import {
  buildViralShareWhatsAppUrl,
  diagnoseNetwork,
  downloadBeforeAfterCardPng,
  formatBytes,
  formatSpeed,
  TEST_PROFILES,
} from './utils/networkDiagnostics';
import { computeTrialStatus } from './utils/plan';

const STORAGE_KEYS = {
  HISTORY: 'juru_speedtest_history_v1',
  THEME: 'juru_speedtest_dark_v1',
  UNIT: 'juru_speedtest_unit_v1',
  PROFILE: 'juru_speedtest_profile_v1',
  MASK_IP: 'juru_speedtest_mask_ip_v1',
  CUSTOM_APNS: 'juru_speedtest_custom_apns_v1',
  ACTIVE_APN: 'juru_speedtest_active_apn_v1',
  TRIALS_USED: 'juru_speedtest_trials_used_v1',
  SHARE_BONUS: 'juru_speedtest_share_bonus_v1',
  BASELINE: 'juru_speedtest_baseline_v1',
  MODE_CHOICE: 'juru_speedtest_mode_choice_v1',
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function sanitizeEntry(raw: SpeedtestHistoryEntry): SpeedtestHistoryEntry {
  return {
    ...raw,
    carrierId: raw.carrierId ? normalizeCarrierId(raw.carrierId) : undefined,
  };
}

function readStoredHistory(): SpeedtestHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(sanitizeEntry) : [];
  } catch {
    return [];
  }
}

function readStoredBaseline(): SpeedtestHistoryEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BASELINE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string') {
      return sanitizeEntry(parsed as SpeedtestHistoryEntry);
    }
    return null;
  } catch {
    return null;
  }
}

function readStoredCustomApns(): ApnProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_APNS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: ApnProfile) => ({
      ...item,
      carrierId: normalizeCarrierId(item.carrierId),
    }));
  } catch {
    return [];
  }
}

function readStoredTrialsUsed(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIALS_USED);
    const parsed = Number.parseInt(raw || '0', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export const App: React.FC = () => {
  const account = useAccount();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved !== null ? saved === 'true' : true;
  });

  const [unit, setUnit] = useState<SpeedUnit>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNIT);
    return saved === 'MB/s' ? 'MB/s' : 'Mbps';
  });

  const [profileId, setProfileId] = useState<TestProfileId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved === 'quick' || saved === 'standard' || saved === 'precision') {
      return saved;
    }
    return 'standard';
  });

  const [maskIp, setMaskIp] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.MASK_IP) === 'true';
  });

  const [trialsUsed, setTrialsUsed] = useState<number>(readStoredTrialsUsed);
  const [hasShareBonus, setHasShareBonus] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHARE_BONUS) === 'true';
  });
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
    );
  });
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageSlug | null>(() =>
    typeof window !== 'undefined'
      ? resolveLegalSlugFromPathname(window.location.pathname)
      : null
  );

  const [customApns, setCustomApns] = useState<ApnProfile[]>(readStoredCustomApns);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierId>('telkomsel');
  const [hasManualCarrierOverride, setHasManualCarrierOverride] = useState(false);
  const [activeApnId, setActiveApnId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_APN) || 'tsel-internet-dual';
  });

  const [chosenMode, setChosenMode] = useState<OptimizationModeChoice>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE_CHOICE);
    return saved === 'gaming' ? 'gaming' : 'speed';
  });

  const [history, setHistory] = useState<SpeedtestHistoryEntry[]>(readStoredHistory);
  const [baselineEntry, setBaselineEntry] = useState<SpeedtestHistoryEntry | null>(
    readStoredBaseline
  );
  const [latestEntry, setLatestEntry] = useState<SpeedtestHistoryEntry | null>(null);
  const [comparisonPopupEntry, setComparisonPopupEntry] =
    useState<SpeedtestHistoryEntry | null>(null);
  const [liveState, setLiveState] = useState<SpeedtestLiveState>(() =>
    createInitialLiveState(null)
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const historySectionRef = useRef<HTMLDivElement | null>(null);

  const trialStatus = useMemo(
    () => computeTrialStatus(trialsUsed, account.plan, hasShareBonus),
    [trialsUsed, account.plan, hasShareBonus]
  );

  // Listen for PWA beforeinstallprompt so users can install in 1 click
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null);
      setInstallNotice(
        '✓ Juru Speedtest berhasil dipasang ke layar utama perangkat Anda!'
      );
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
        setInstallPromptEvent(null);
      }
      return;
    }
    setInstallNotice(
      'Untuk memasang aplikasi Juru Speedtest ke Layar Utama HP: ketuk ikon Menu Browser (⋮ di Chrome Android atau tombol Bagikan di Safari iOS) lalu pilih "Tambahkan ke Layar Utama / Install Aplikasi".'
    );
  }, [installPromptEvent]);

  const handleClaimShareBonus = useCallback(() => {
    setHasShareBonus(true);
    try {
      localStorage.setItem(STORAGE_KEYS.SHARE_BONUS, 'true');
    } catch {
      // ignore storage quota
    }
  }, []);

  const allApnProfiles = useMemo(
    () => [...customApns, ...PRESET_APN_PROFILES],
    [customApns]
  );

  const activeApnProfile = useMemo(
    () => allApnProfiles.find(p => p.id === activeApnId) || null,
    [allApnProfiles, activeApnId]
  );

  const carrierProfiles = useMemo(
    () => allApnProfiles.filter(p => p.carrierId === selectedCarrier),
    [allApnProfiles, selectedCarrier]
  );

  const carrierEvaluation = useMemo(
    () => evaluateAndRankApns(carrierProfiles, history),
    [carrierProfiles, history]
  );

  // Derive post-baseline entries for Before vs After comparison
  const { afterSpeedEntry, afterGamingEntry, latestAfterEntry } = useMemo(() => {
    if (!baselineEntry) {
      return {
        afterSpeedEntry: null,
        afterGamingEntry: null,
        latestAfterEntry: null,
      };
    }
    const baseTime = new Date(baselineEntry.timestamp).getTime();
    const afterItems = history.filter(
      item =>
        item.id !== baselineEntry.id &&
        new Date(item.timestamp).getTime() >= baseTime
    );
    const speedMatch =
      afterItems.find(
        item => item.stageRole === 'after_speed' || item.chosenMode === 'speed'
      ) || null;
    const gamingMatch =
      afterItems.find(
        item => item.stageRole === 'after_gaming' || item.chosenMode === 'gaming'
      ) || null;
    return {
      afterSpeedEntry: speedMatch,
      afterGamingEntry: gamingMatch,
      latestAfterEntry: afterItems[0] || null,
    };
  }, [baselineEntry, history]);

  // Sync browser Back/Forward navigation for compliance routes
  useEffect(() => {
    const onPopState = () => {
      setActiveLegalPage(resolveLegalSlugFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleOpenLegalPage = useCallback((slug: LegalPageSlug) => {
    setActiveLegalPage(slug);
    const targetPath = LEGAL_PAGE_ROUTES[slug].path;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToApp = useCallback(() => {
    setActiveLegalPage(null);
    if (resolveLegalSlugFromPathname(window.location.pathname) !== null) {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNIT, unit);
  }, [unit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, profileId);
  }, [profileId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASK_IP, String(maskIp));
  }, [maskIp]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_APN, activeApnId);
  }, [activeApnId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODE_CHOICE, chosenMode);
  }, [chosenMode]);

  // Discover ISP & Edge PoP on initial mount and auto-match Indonesian Carrier + Default APN
  useEffect(() => {
    const ctrl = new AbortController();
    fetchNetworkMetadata(ctrl.signal).then(meta => {
      if (!ctrl.signal.aborted) {
        setLiveState(prev =>
          prev.networkMeta ? prev : { ...prev, networkMeta: meta }
        );
        const det = detectCarrierFromNetwork(meta);
        setSelectedCarrier(det.carrierId);
        const savedApn = localStorage.getItem(STORAGE_KEYS.ACTIVE_APN);
        if (!savedApn) {
          const defaultForCarrier = PRESET_APN_PROFILES.find(
            p => p.carrierId === det.carrierId && p.isOfficialDefault
          );
          if (defaultForCarrier) {
            setActiveApnId(defaultForCarrier.id);
          }
        }
      }
    });
    return () => ctrl.abort();
  }, []);

  const handleSelectCarrier = useCallback(
    (carrier: CarrierId) => {
      setSelectedCarrier(carrier);
      setHasManualCarrierOverride(true);
      const currentBelongs = allApnProfiles.some(
        p => p.id === activeApnId && p.carrierId === carrier
      );
      if (!currentBelongs) {
        const defaultProfile =
          allApnProfiles.find(
            p => p.carrierId === carrier && p.isOfficialDefault
          ) || allApnProfiles.find(p => p.carrierId === carrier);
        if (defaultProfile) {
          setActiveApnId(defaultProfile.id);
        }
      }
    },
    [allApnProfiles, activeApnId]
  );

  const handleChooseModeAndApn = useCallback(
    (mode: OptimizationModeChoice, apnId: string) => {
      setChosenMode(mode);
      setActiveApnId(apnId);
    },
    []
  );

  const handleResetBaseline = useCallback(() => {
    setBaselineEntry(null);
    localStorage.removeItem(STORAGE_KEYS.BASELINE);
  }, []);

  const handleCreateCustomApn = useCallback((newProfile: ApnProfile) => {
    setCustomApns(prev => {
      const next = [newProfile, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_APNS, JSON.stringify(next));
      } catch {
        // Ignore storage quota
      }
      return next;
    });
  }, []);

  const handleDeleteCustomApn = useCallback(
    (apnId: string) => {
      setCustomApns(prev => {
        const next = prev.filter(p => p.id !== apnId);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_APNS, JSON.stringify(next));
        return next;
      });
      if (activeApnId === apnId) {
        const fallback = PRESET_APN_PROFILES.find(
          p => p.carrierId === selectedCarrier
        );
        if (fallback) setActiveApnId(fallback.id);
      }
    },
    [activeApnId, selectedCarrier]
  );

  const isRunning =
    liveState.phase === 'init' ||
    liveState.phase === 'ping' ||
    liveState.phase === 'download' ||
    liveState.phase === 'upload';

  const handleStartTest = useCallback(async () => {
    if (isRunning) return;

    // Gate 4th+ Speedtest when 3x Free Trial is exhausted on Free plan
    if (!trialStatus.canUsePremiumFeatures) {
      setIsPricingOpen(true);
      return;
    }

    if (activeLegalPage !== null) {
      setActiveLegalPage(null);
    }

    abortControllerRef.current?.abort();
    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;
    setLatestEntry(null);

    const activeProfile = TEST_PROFILES[profileId];
    const taggedApn = allApnProfiles.find(p => p.id === activeApnId) || null;

    const finalState = await runFullSpeedtest({
      profile: activeProfile,
      existingMeta: liveState.networkMeta,
      signal: ctrl.signal,
      onUpdate: updated => setLiveState(updated),
    });

    if (finalState.phase === 'complete') {
      const diag = diagnoseNetwork(
        finalState.downloadMbps,
        finalState.uploadMbps,
        finalState.latency,
        finalState.downloadPeakMbps,
        finalState.downloadSeries
      );
      const meta = finalState.networkMeta;
      const isSameDayAndNetwork =
        baselineEntry &&
        new Date(baselineEntry.timestamp).toDateString() === new Date().toDateString() &&
        (!meta?.isp || meta.isp === baselineEntry.isp) &&
        (!meta?.city || meta.city === baselineEntry.city);

      const isInitialAreaRecording = !baselineEntry || !isSameDayAndNetwork;

      const stageRole: TestStageRole = isInitialAreaRecording
        ? 'before'
        : chosenMode === 'gaming'
        ? 'after_gaming'
        : 'after_speed';

      const entry: SpeedtestHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        profileId,
        downloadMbps: Number(finalState.downloadMbps.toFixed(2)),
        downloadPeakMbps: Number(finalState.downloadPeakMbps.toFixed(2)),
        uploadMbps: Number(finalState.uploadMbps.toFixed(2)),
        uploadPeakMbps: Number(finalState.uploadPeakMbps.toFixed(2)),
        pingMs: Number(finalState.latency.unloadedMs.toFixed(1)),
        jitterMs: Number(finalState.latency.jitterMs.toFixed(1)),
        packetLossPct: Number(finalState.latency.packetLossPct.toFixed(1)),
        downloadLoadedMs: finalState.latency.downloadLoadedMs
          ? Number(finalState.latency.downloadLoadedMs.toFixed(1))
          : null,
        uploadLoadedMs: finalState.latency.uploadLoadedMs
          ? Number(finalState.latency.uploadLoadedMs.toFixed(1))
          : null,
        bufferbloatGrade: diag.bufferbloatGrade,
        overallScore: diag.overallScore,
        gamingScore: diag.gamingScore,
        isp: meta?.isp || 'ISP Indonesia',
        asn: meta?.asn,
        ip: meta?.ip || '—',
        ipVersion: meta?.ipVersion,
        connectionType: meta?.connectionType,
        city: meta?.city || 'Indonesia',
        coloCode: meta?.coloCode || 'EDGE',
        coloCity: meta?.coloCity || 'Edge Global',
        downloadBytesUsed: finalState.downloadBytes,
        uploadBytesUsed: finalState.uploadBytes,
        totalBytesUsed: finalState.downloadBytes + finalState.uploadBytes,
        apnId: taggedApn?.id,
        apnName: taggedApn?.name,
        apnValue: taggedApn?.apn,
        apnProtocol: taggedApn?.protocol,
        carrierId: taggedApn?.carrierId || selectedCarrier,
        stageRole,
        chosenMode: !isInitialAreaRecording ? chosenMode : undefined,
      };

      // Record baseline automatically on initial test or when day/area changes
      if (isInitialAreaRecording) {
        setBaselineEntry(entry);
        try {
          localStorage.setItem(STORAGE_KEYS.BASELINE, JSON.stringify(entry));
        } catch {
          // Ignore storage quota
        }
      } else {
        // 2nd+ test completed: automatically pop up Before vs After comparison modal!
        setComparisonPopupEntry(entry);
      }

      // Free Trial counter: initial recording on the same day & same network does NOT deduct quota!
      // Only subsequent comparisons or different day/area tests count toward the 9x limit.
      const shouldDeductQuota =
        account.plan === 'free' &&
        (!isInitialAreaRecording ||
          (baselineEntry &&
            new Date(baselineEntry.timestamp).toDateString() !== new Date().toDateString()));

      if (shouldDeductQuota) {
        setTrialsUsed(prev => {
          const next = prev + 1;
          try {
            localStorage.setItem(STORAGE_KEYS.TRIALS_USED, String(next));
          } catch {
            // Ignore storage quota
          }
          return next;
        });
      }

      setLatestEntry(entry);
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, 40);
        try {
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
        } catch {
          // Ignore quota exceeded
        }
        return next;
      });
    }
  }, [
    isRunning,
    trialStatus.canUsePremiumFeatures,
    activeLegalPage,
    profileId,
    allApnProfiles,
    activeApnId,
    liveState.networkMeta,
    baselineEntry,
    chosenMode,
    selectedCarrier,
    account.plan,
  ]);

  const handleScrollAndStartTest = useCallback(() => {
    if (!trialStatus.canUsePremiumFeatures) {
      setIsPricingOpen(true);
      return;
    }
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    handleStartTest();
  }, [trialStatus.canUsePremiumFeatures, handleStartTest]);

  const handleAbortTest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleDeleteEntry = useCallback(
    (id: string) => {
      setHistory(prev => {
        const next = prev.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
        return next;
      });
      setLatestEntry(prev => (prev?.id === id ? null : prev));
      if (baselineEntry?.id === id) {
        setBaselineEntry(null);
        localStorage.removeItem(STORAGE_KEYS.BASELINE);
      }
    },
    [baselineEntry]
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setLatestEntry(null);
    setBaselineEntry(null);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BASELINE);
  }, []);

  const diagnosis = useMemo(() => {
    if (liveState.phase !== 'complete') return null;
    return diagnoseNetwork(
      liveState.downloadMbps,
      liveState.uploadMbps,
      liveState.latency,
      liveState.downloadPeakMbps,
      liveState.downloadSeries
    );
  }, [
    liveState.phase,
    liveState.downloadMbps,
    liveState.uploadMbps,
    liveState.latency,
    liveState.downloadPeakMbps,
    liveState.downloadSeries,
  ]);

  const activeProfile = TEST_PROFILES[profileId];

  return (
    <div className="bg-telemetry-grid flex min-h-screen flex-col">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(d => !d)}
        profileId={profileId}
        onChangeProfile={setProfileId}
        unit={unit}
        onChangeUnit={setUnit}
        networkMeta={liveState.networkMeta}
        isRunning={isRunning}
        trialStatus={trialStatus}
        onOpenPricing={() => setIsPricingOpen(true)}
        onNavigateHome={handleBackToApp}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 sm:px-6">
        {/* Payment Return / Sync Notice Banner */}
        {account.paymentNotice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{account.paymentNotice}</span>
            </div>
            <button
              type="button"
              onClick={account.clearPaymentNotice}
              className="cursor-pointer rounded-lg p-1 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeLegalPage ? (
          <LegalCompliancePages
            activePage={activeLegalPage}
            onSelectPage={handleOpenLegalPage}
            onBackToApp={handleBackToApp}
            onOpenPricing={() => setIsPricingOpen(true)}
          />
        ) : (
          <>
            {/* Top Monetization / Sponsor Banner (Automatically hidden for Rp 4.999 Lifetime Pro users) */}
            <div className="mb-5">
              <MonetizationAdBanner
                subscriptionPlan={account.plan}
                city={liveState.networkMeta?.city}
                isp={liveState.networkMeta?.isp}
                onOpenPricing={() => setIsPricingOpen(true)}
                placement="top"
              />
            </div>

            {/* Error Notification Banner */}
            {liveState.phase === 'error' && liveState.errorMessage && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{liveState.errorMessage}</span>
              </div>
            )}

            {/* Hero Instrument Section: Gauge (Left 5 cols) + Live Chart & KPIs (Right 7 cols) */}
            <div
              ref={heroSectionRef}
              className="grid scroll-mt-20 grid-cols-1 items-stretch gap-6 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <SpeedometerGauge
                  phase={liveState.phase}
                  gaugeMbps={liveState.currentGaugeMbps}
                  unit={unit}
                  pingMs={liveState.latency.unloadedMs}
                  overallProgress={liveState.overallProgress}
                  hasBaseline={Boolean(baselineEntry)}
                  chosenMode={chosenMode}
                  activeApnCode={activeApnProfile?.apn}
                  trialStatus={trialStatus}
                  onStart={handleStartTest}
                  onAbort={handleAbortTest}
                  onOpenPricing={() => setIsPricingOpen(true)}
                />
              </div>

              <div className="lg:col-span-7">
                <LiveThroughputChart
                  phase={liveState.phase}
                  unit={unit}
                  downloadMbps={liveState.downloadMbps}
                  downloadPeakMbps={liveState.downloadPeakMbps}
                  downloadBytes={liveState.downloadBytes}
                  uploadMbps={liveState.uploadMbps}
                  uploadPeakMbps={liveState.uploadPeakMbps}
                  uploadBytes={liveState.uploadBytes}
                  latency={liveState.latency}
                  downloadSeries={liveState.downloadSeries}
                  uploadSeries={liveState.uploadSeries}
                  downloadDurationMs={activeProfile.downloadDurationMs}
                  uploadDurationMs={activeProfile.uploadDurationMs}
                />
              </div>
            </div>

            {/* Guided Before vs After Comparison + Speed vs Stable Gaming APN Choice */}
            <BeforeAfterComparisonPanel
              networkMeta={liveState.networkMeta}
              onRefreshNetworkMeta={() => {
                fetchNetworkMetadata().then(meta => {
                  setLiveState(prev => ({ ...prev, networkMeta: meta }));
                });
              }}
              selectedCarrier={selectedCarrier}
              onSelectCarrier={handleSelectCarrier}
              fastestCandidate={carrierEvaluation.fastest}
              mostStableCandidate={carrierEvaluation.mostStable}
              activeApnProfile={activeApnProfile}
              chosenMode={chosenMode}
              onChooseModeAndApn={handleChooseModeAndApn}
              baselineEntry={baselineEntry}
              afterSpeedEntry={afterSpeedEntry}
              afterGamingEntry={afterGamingEntry}
              latestAfterEntry={latestAfterEntry}
              onResetBaseline={handleResetBaseline}
              onStartSpeedtest={handleScrollAndStartTest}
              isRunning={isRunning}
              unit={unit}
              maskIp={maskIp}
              trialStatus={trialStatus}
              onOpenPricing={() => setIsPricingOpen(true)}
              onClaimShareBonus={handleClaimShareBonus}
            />

            {/* Share PNG Certificate & Clear Local History (APN, Download/Upload Data, Ping/Jitter) */}
            <div ref={historySectionRef} className="scroll-mt-20">
              <HistoryAndSharePanel
                latestEntry={latestEntry}
                history={history}
                unit={unit}
                maskIp={maskIp}
                onDeleteEntry={handleDeleteEntry}
                onClearHistory={handleClearHistory}
              />
            </div>

            {/* Network Metadata, Bufferbloat & Activity Readiness */}
            <NetworkDiagnosticsSection
              networkMeta={liveState.networkMeta}
              maskIp={maskIp}
              onToggleMaskIp={() => setMaskIp(m => !m)}
              latency={liveState.latency}
              diagnosis={diagnosis}
            />

            {/* ============================================================== */}
            {/* PRO / ADVANCED FEATURES WITH ELECTRIC LIGHT BEAM BORDER        */}
            {/* ============================================================== */}
            <div className="pro-electric-frame mt-6">
              <div className="pro-electric-inner relative overflow-hidden bg-white dark:bg-[#070B14]">
                <div
                  className={
                    !trialStatus.isPro
                      ? 'pointer-events-none max-h-[540px] overflow-hidden p-2 opacity-40 blur-[2px] transition select-none'
                      : 'p-2'
                  }
                >
                  {/* Game Server Ping Radar (MLBB, PUBGM, FF, Valorant), Private DNS & 4G/5G LTE Band Lock */}
                  <GameAndRadioBoosterPanel
                    selectedCarrier={selectedCarrier}
                    onSelectCarrier={handleSelectCarrier}
                    basePingMs={liveState.latency.unloadedMs}
                    baseJitterMs={liveState.latency.jitterMs}
                    trialStatus={trialStatus}
                    onOpenPricing={() => setIsPricingOpen(true)}
                  />

                  {/* Full Indonesian APN Catalog, Custom APN Builder & Smart Multi-APN Benchmark Lab */}
                  <ApnOptimizerLab
                    networkMeta={liveState.networkMeta}
                    selectedCarrier={selectedCarrier}
                    hasManualCarrierOverride={hasManualCarrierOverride}
                    onSelectCarrier={handleSelectCarrier}
                    allProfiles={allApnProfiles}
                    activeApnId={activeApnId}
                    onSelectActiveApn={setActiveApnId}
                    onCreateCustomApn={handleCreateCustomApn}
                    onDeleteCustomApn={handleDeleteCustomApn}
                    history={history}
                    latestEntry={latestEntry}
                    unit={unit}
                    isRunning={isRunning}
                    trialStatus={trialStatus}
                    onOpenPricing={() => setIsPricingOpen(true)}
                    onStartSpeedtestNow={handleScrollAndStartTest}
                  />
                </div>

                {!trialStatus.isPro && (
                  <div className="inset-x-0 bottom-0 z-20 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950/95 via-slate-900/90 to-slate-900/75 p-6 text-center text-white backdrop-blur-xs sm:absolute sm:inset-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-teal-400 text-slate-950 shadow-lg shadow-amber-500/30">
                      <Lock className="h-7 w-7" />
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-300 uppercase">
                      <Crown className="h-3.5 w-3.5" />
                      Fitur Advanced Pro • Sekali Bayar Selamanya
                    </span>
                    <h3 className="mt-2 max-w-lg font-display text-lg font-extrabold text-white sm:text-xl">
                      Buka Game Ping Radar, Kunci Sinyal 4G/5G &amp; Racik APN Custom Semua Operator
                    </h3>
                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-300">
                      Dapatkan akses penuh ke <strong>Radar Ping Server Game (MLBB, PUBG, FF, Valorant)</strong>, <strong>Private DNS Anti-Lag</strong>, <strong>Katalog Lengkap &amp; Custom APN Lab</strong>, serta <strong>Unlimited Speedtest Tanpa Iklan</strong> di semua area!
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPricingOpen(true)}
                      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-teal-300 px-6 py-3 text-xs font-extrabold tracking-wide text-slate-950 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] sm:text-sm"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Buka Semua Fitur Pro — Hanya {MONETIZATION_CONFIG.pricing.lifetimeLabel} Selamanya
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Monetization / Sponsor Banner */}
            <div className="mt-6">
              <MonetizationAdBanner
                subscriptionPlan={account.plan}
                city={liveState.networkMeta?.city}
                isp={liveState.networkMeta?.isp}
                onOpenPricing={() => setIsPricingOpen(true)}
                placement="bottom"
              />
            </div>
          </>
        )}
      </main>

      <SiteFooter
        onOpenLegalPage={handleOpenLegalPage}
        onOpenPricing={() => setIsPricingOpen(true)}
      />

      {/* =================================================================== */}
      {/* POP-UP MODAL OTOMATIS SETELAH TES KE-2 & SETERUSNYA                 */}
      {/* =================================================================== */}
      {comparisonPopupEntry && baselineEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs sm:p-5">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-emerald-500/60 bg-white p-5 shadow-2xl sm:p-6 dark:bg-[#0C1324]">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Hasil Perbandingan Selesai • Area {comparisonPopupEntry.city}
                </span>
                <h3 className="mt-1.5 font-display text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
                  Perbandingan Sebelum vs Sesudah Pakai APN
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jaringan: <strong>{comparisonPopupEntry.isp}</strong> • Sisa Kuota Hari Ini:{' '}
                  <strong>
                    {trialStatus.isPro
                      ? 'Unlimited (Pro)'
                      : `${trialStatus.trialsRemaining}/${trialStatus.effectiveTrialLimit}x`}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparisonPopupEntry(null)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 2 Columns: SEBELUM vs SESUDAH */}
            {(() => {
              const dlDiff = comparisonPopupEntry.downloadMbps - baselineEntry.downloadMbps;
              const dlPct =
                baselineEntry.downloadMbps > 0
                  ? Math.round((dlDiff / baselineEntry.downloadMbps) * 100)
                  : 0;
              const ulDiff = comparisonPopupEntry.uploadMbps - baselineEntry.uploadMbps;
              const ulPct =
                baselineEntry.uploadMbps > 0
                  ? Math.round((ulDiff / baselineEntry.uploadMbps) * 100)
                  : 0;
              const pingDiff = comparisonPopupEntry.pingMs - baselineEntry.pingMs;

              return (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Kolom 1: SEBELUM */}
                  <div className="rounded-2xl border border-sky-500/35 bg-sky-500/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-extrabold text-sky-800 uppercase dark:text-sky-300">
                        SEBELUM (AWAL)
                      </span>
                      <span className="font-mono-tabular text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        APN: {baselineEntry.apnValue || 'default'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                      {baselineEntry.apnName || 'Rekaman Awal Area'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 font-mono-tabular">
                      <div className="rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/80">
                        <span className="block text-[10px] text-slate-400">Download</span>
                        <strong className="text-base text-slate-900 dark:text-white">
                          {formatSpeed(baselineEntry.downloadMbps, unit)} {unit}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/80">
                        <span className="block text-[10px] text-slate-400">Upload</span>
                        <strong className="text-base text-slate-900 dark:text-white">
                          {formatSpeed(baselineEntry.uploadMbps, unit)} {unit}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/80">
                        <span className="block text-[10px] text-slate-400">Ping / Jitter</span>
                        <strong className="text-sm text-slate-900 dark:text-white">
                          {Math.round(baselineEntry.pingMs)} ms (±{baselineEntry.jitterMs.toFixed(1)})
                        </strong>
                      </div>
                      <div className="rounded-xl bg-white/80 p-2.5 dark:bg-slate-900/80">
                        <span className="block text-[10px] text-slate-400">Data Terpakai</span>
                        <strong className="text-sm text-slate-900 dark:text-white">
                          {formatBytes(baselineEntry.totalBytesUsed)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2: SESUDAH */}
                  <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/[0.08] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 uppercase">
                        SESUDAH ({comparisonPopupEntry.chosenMode === 'gaming' ? 'STABIL' : 'CEPAT'})
                      </span>
                      <span className="font-mono-tabular text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                        APN: {comparisonPopupEntry.apnValue || 'optimasi'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white">
                      {comparisonPopupEntry.apnName || 'APN Rekomendasi'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 font-mono-tabular">
                      <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Download</span>
                          {dlDiff !== 0 && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ${
                                dlDiff > 0 ? 'text-emerald-500' : 'text-amber-500'
                              }`}
                            >
                              <TrendingUp className="h-3 w-3" />
                              {dlDiff > 0 ? '+' : ''}
                              {dlPct}%
                            </span>
                          )}
                        </div>
                        <strong className="text-base text-emerald-600 dark:text-emerald-400">
                          {formatSpeed(comparisonPopupEntry.downloadMbps, unit)} {unit}
                        </strong>
                      </div>

                      <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Upload</span>
                          {ulDiff !== 0 && (
                            <span
                              className={`text-[10px] font-extrabold ${
                                ulDiff > 0 ? 'text-sky-500' : 'text-amber-500'
                              }`}
                            >
                              {ulDiff > 0 ? '+' : ''}
                              {ulPct}%
                            </span>
                          )}
                        </div>
                        <strong className="text-base text-sky-600 dark:text-sky-400">
                          {formatSpeed(comparisonPopupEntry.uploadMbps, unit)} {unit}
                        </strong>
                      </div>

                      <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Ping / Jitter</span>
                          {pingDiff !== 0 && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold ${
                                pingDiff < 0 ? 'text-emerald-500' : 'text-amber-500'
                              }`}
                            >
                              <TrendingDown className="h-3 w-3" />
                              {pingDiff < 0
                                ? `${Math.round(pingDiff)}ms`
                                : `+${Math.round(pingDiff)}ms`}
                            </span>
                          )}
                        </div>
                        <strong className="text-sm text-slate-900 dark:text-white">
                          {Math.round(comparisonPopupEntry.pingMs)} ms (±
                          {comparisonPopupEntry.jitterMs.toFixed(1)})
                        </strong>
                      </div>

                      <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/90">
                        <span className="block text-[10px] text-slate-400">Data Terpakai</span>
                        <strong className="text-sm text-slate-900 dark:text-white">
                          {formatBytes(comparisonPopupEntry.totalBytesUsed)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons in Modal: 1 Primary Button for Full History + Share/Download */}
            <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setComparisonPopupEntry(null);
                  setTimeout(() => {
                    historySectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 120);
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-sky-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-500/25 transition hover:scale-[1.01] sm:text-sm"
              >
                <History className="h-4 w-4" />
                <span>Lihat History Lengkap di Panel</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadBeforeAfterCardPng(baselineEntry, comparisonPopupEntry, maskIp)
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Bukti PNG</span>
                </button>

                <a
                  href={buildViralShareWhatsAppUrl(baselineEntry, comparisonPopupEntry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleClaimShareBonus()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-500/25 dark:text-emerald-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Share WA</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentPlan={account.plan}
        trialStatus={trialStatus}
        account={account}
        baselineEntry={baselineEntry}
        afterEntry={latestAfterEntry}
        onClaimShareBonus={handleClaimShareBonus}
        onOpenLegalPage={slug => {
          setIsPricingOpen(false);
          handleOpenLegalPage(slug);
        }}
      />
    </div>
  );
};

export default App;
