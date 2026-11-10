import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Download,
  ExternalLink,
  Flame,
  HelpCircle,
  Lock,
  Plus,
  RadioTower,
  Shield,
  Sliders,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import type {
  ApnAuthType,
  ApnFocusTag,
  ApnProfile,
  ApnProtocol,
  CarrierId,
  NetworkMeta,
  SpeedUnit,
  SpeedtestHistoryEntry,
} from '../types/speedtest';
import {
  CARRIER_CATALOG,
  detectCarrierFromNetwork,
  downloadIosMobileConfig,
  evaluateAndRankApns,
  formatApnParametersText,
  generateSmartApnRecipe,
  openAndroidApnSettingsScreen,
} from '../utils/apnDatabase';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import { formatSpeed } from '../utils/networkDiagnostics';
import type { TrialQuotaStatus } from '../utils/plan';

interface ApnOptimizerLabProps {
  networkMeta: NetworkMeta | null;
  selectedCarrier: CarrierId;
  hasManualCarrierOverride: boolean;
  onSelectCarrier: (carrier: CarrierId) => void;
  allProfiles: ApnProfile[];
  activeApnId: string;
  onSelectActiveApn: (apnId: string) => void;
  onCreateCustomApn: (newProfile: ApnProfile) => void;
  onDeleteCustomApn: (apnId: string) => void;
  history: SpeedtestHistoryEntry[];
  latestEntry: SpeedtestHistoryEntry | null;
  unit: SpeedUnit;
  isRunning: boolean;
  trialStatus: TrialQuotaStatus;
  onOpenPricing: () => void;
  onStartSpeedtestNow: () => void;
}

export const ApnOptimizerLab: React.FC<ApnOptimizerLabProps> = ({
  networkMeta,
  selectedCarrier,
  hasManualCarrierOverride,
  onSelectCarrier,
  allProfiles,
  activeApnId,
  onSelectActiveApn,
  onCreateCustomApn,
  onDeleteCustomApn,
  history,
  latestEntry,
  unit,
  isRunning,
  trialStatus,
  onOpenPricing,
  onStartSpeedtestNow,
}) => {
  const [showCreator, setShowCreator] = useState(false);
  const [inspectProfile, setInspectProfile] = useState<ApnProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [androidGuideBanner, setAndroidGuideBanner] = useState<string | null>(null);

  // Form state for creating a new APN
  const [formName, setFormName] = useState('');
  const [formApn, setFormApn] = useState('internet');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formProxy, setFormProxy] = useState('');
  const [formPort, setFormPort] = useState('');
  const [formAuth, setFormAuth] = useState<ApnAuthType>('None');
  const [formApnType, setFormApnType] = useState('default,supl');
  const [formProtocol, setFormProtocol] = useState<ApnProtocol>('IPv4/IPv6');
  const [formRoamingProtocol, setFormRoamingProtocol] = useState<ApnProtocol>('IPv4');
  const [formBearer, setFormBearer] = useState('Unspecified');
  const [formFocus, setFormFocus] = useState<ApnFocusTag>('speed');
  const [formSummary, setFormSummary] = useState('');

  const detection = useMemo(() => detectCarrierFromNetwork(networkMeta), [networkMeta]);

  const carrierProfiles = useMemo(
    () => allProfiles.filter(p => p.carrierId === selectedCarrier),
    [allProfiles, selectedCarrier]
  );

  const evaluation = useMemo(
    () => evaluateAndRankApns(carrierProfiles, history),
    [carrierProfiles, history]
  );

  const handleOpenCreatorWithRecipe = (focus: ApnFocusTag) => {
    if (!trialStatus.canUsePremiumFeatures) {
      onOpenPricing();
      return;
    }
    const recipe = generateSmartApnRecipe(selectedCarrier, focus, latestEntry);
    setFormName(recipe.name);
    setFormApn(recipe.apn);
    setFormUsername(recipe.username);
    setFormPassword(recipe.password);
    setFormProxy(recipe.proxy);
    setFormPort(recipe.port);
    setFormAuth(recipe.authType);
    setFormApnType(recipe.apnType);
    setFormProtocol(recipe.protocol);
    setFormRoamingProtocol(recipe.roamingProtocol);
    setFormBearer(recipe.bearer);
    setFormFocus(focus);
    setFormSummary(recipe.summary);
    setShowCreator(true);
  };

  const handleSaveNewApn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim() || `Custom APN ${CARRIER_CATALOG[selectedCarrier].shortName}`;
    const cleanApn = formApn.trim() || 'internet';

    // Estimate scores heuristically based on protocol, proxy, and focus
    const hasLegacyProxy = Boolean(formProxy.trim());
    let estSpeed = formProtocol === 'IPv4/IPv6' ? 93 : 87;
    let estStab = formProtocol === 'IPv4' ? 93 : 88;
    if (hasLegacyProxy) {
      estSpeed -= 16;
      estStab -= 10;
    }
    if (formFocus === 'gaming') estStab = Math.min(96, estStab + 3);
    if (formFocus === 'speed') estSpeed = Math.min(96, estSpeed + 2);

    const created: ApnProfile = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      carrierId: selectedCarrier,
      name: cleanName,
      apn: cleanApn,
      username: formUsername.trim(),
      password: formPassword.trim(),
      proxy: formProxy.trim(),
      port: formPort.trim(),
      authType: formAuth,
      apnType: formApnType.trim() || 'default,supl',
      protocol: formProtocol,
      roamingProtocol: formRoamingProtocol,
      bearer: formBearer,
      focus: formFocus,
      isCustom: true,
      estimatedSpeedScore: estSpeed,
      estimatedStabilityScore: estStab,
      summary:
        formSummary.trim() ||
        `Profil APN kustom (${cleanApn}) dengan protokol ${formProtocol} dan tipe ${
          formApnType.trim() || 'default,supl'
        }.`,
      bestFor:
        formFocus === 'gaming'
          ? 'Ping stabil & rendah jitter'
          : formFocus === 'hotspot'
          ? 'Tethering hotspot & modem'
          : 'Kecepatan unduh & unggah optimal',
    };

    onCreateCustomApn(created);
    onSelectActiveApn(created.id);
    setShowCreator(false);
    setInspectProfile(created);
  };

  const handleCopyProfile = async (profile: ApnProfile) => {
    if (!trialStatus.canUsePremiumFeatures && !profile.isOfficialDefault) {
      onOpenPricing();
      return;
    }
    try {
      await navigator.clipboard.writeText(formatApnParametersText(profile));
      setCopiedId(profile.id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleTriggerAndroidApn = async (profile: ApnProfile) => {
    if (!trialStatus.canUsePremiumFeatures && !profile.isOfficialDefault) {
      onOpenPricing();
      return;
    }
    await handleCopyProfile(profile);
    const { isAndroid } = openAndroidApnSettingsScreen();
    if (!isAndroid) {
      setAndroidGuideBanner(
        `Parameter APN "${profile.name}" telah disalin! Karena Anda membuka dari perangkat non-Android, buka Pengaturan Seluler / Jaringan Seluler -> Nama Titik Akses (APN) di HP atau dashboard Modem (192.168.8.1) lalu tempel nilainya.`
      );
    } else {
      setAndroidGuideBanner(
        `Membuka Pengaturan APN Android... Parameter "${profile.apn}" sudah disalin ke papan klip Anda.`
      );
    }
  };

  const activeProfileObj = allProfiles.find(p => p.id === activeApnId) || null;

  return (
    <section className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800/90 dark:bg-[#0C1221]">
      {/* Top Header Row */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-center dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-teal-700 uppercase dark:text-teal-300">
              <RadioTower className="h-3.5 w-3.5" />
              Juru APN Lab &amp; Smart Recommender
            </span>
            {!hasManualCarrierOverride && !detection.isFixedBroadband && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Kartu Terdeteksi Otomatis
              </span>
            )}
          </div>
          <h2 className="font-display text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
            Pemilihan APN, Racik APN Baru &amp; Rekomendasi Tercepat
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {detection.detectedNote}
          </p>
        </div>

        {/* Action Buttons: Racik Otomatis & Buat APN Baru */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenCreatorWithRecipe('gaming')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-500/20 dark:text-violet-300"
          >
            {!trialStatus.canUsePremiumFeatures ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            <span>Racik Otomatis Pintar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!trialStatus.canUsePremiumFeatures) {
                onOpenPricing();
                return;
              }
              handleOpenCreatorWithRecipe('speed');
              setFormName('');
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
          >
            {!trialStatus.canUsePremiumFeatures ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>
              {!trialStatus.canUsePremiumFeatures
                ? `Buat APN (${MONETIZATION_CONFIG.pricing.lifetimeLabel})`
                : 'Buat APN Baru'}
            </span>
          </button>
        </div>
      </div>

      {/* Carrier / SIM Selector Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(Object.keys(CARRIER_CATALOG) as CarrierId[]).map(cid => {
          const c = CARRIER_CATALOG[cid];
          const active = cid === selectedCarrier;
          return (
            <button
              key={cid}
              type="button"
              onClick={() => onSelectCarrier(cid)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'border-teal-500 bg-teal-500/12 text-teal-700 shadow-xs dark:text-teal-300'
                  : 'border-slate-200/90 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full bg-current ${c.accentClass}`} />
              <span>{c.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Active Carrier Indonesia MCC-MNC & Radio Metadata Strip */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 font-mono-tabular font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          MCC/MNC: {CARRIER_CATALOG[selectedCarrier].mccMnc}
        </span>
        <span className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          Radio: {CARRIER_CATALOG[selectedCarrier].networkGeneration}
        </span>
        <span>•</span>
        <span>Sub-brand didukung: {CARRIER_CATALOG[selectedCarrier].subBrands}</span>
      </div>

      {/* Notification Banner for Android Settings / Copy Feedback */}
      {androidGuideBanner && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-sky-500/35 bg-sky-500/10 p-3.5 text-xs text-sky-800 dark:text-sky-200">
          <div className="flex items-start gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
            <span>{androidGuideBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAndroidGuideBanner(null)}
            className="cursor-pointer text-sky-500 hover:text-sky-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Smart Recommendation & Winner Dashboard */}
      {evaluation.bestOverall && (
        <div className="mt-5 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/[0.08] via-sky-500/[0.05] to-transparent p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-teal-500/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-teal-700 uppercase dark:text-teal-300">
                  <Award className="h-3.5 w-3.5" />
                  {evaluation.hasEmpiricalComparison
                    ? 'Rekomendasi Berdasarkan Hasil Uji Riil'
                    : ' Analisis & Gambaran Karakteristik APN'}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {CARRIER_CATALOG[selectedCarrier].name} ({CARRIER_CATALOG[selectedCarrier].subBrands})
                </span>
              </div>
              <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                {evaluation.recommendationHeadline}
              </h3>
              <p className="max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {evaluation.recommendationDetail}
              </p>
            </div>

            {/* 3 Quick Winner Badges */}
            <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[410px]">
              <div className="rounded-xl border border-emerald-500/30 bg-white/80 p-2.5 dark:bg-slate-900/80">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                  <Award className="h-3 w-3" />
                  <span>Terbaik Umum</span>
                </div>
                <p className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {!trialStatus.canUsePremiumFeatures && !evaluation.bestOverall.profile.isOfficialDefault
                    ? `🔒 ${MONETIZATION_CONFIG.pricing.lifetimeLabel}`
                    : evaluation.bestOverall.profile.apn}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {evaluation.bestOverall.avgDownloadMbps !== null
                    ? `${formatSpeed(evaluation.bestOverall.avgDownloadMbps, unit)} ${unit}`
                    : `Skor ${evaluation.bestOverall.effectiveSpeedScore}/100`}
                </p>
              </div>

              <div className="rounded-xl border border-teal-500/30 bg-white/80 p-2.5 dark:bg-slate-900/80">
                <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase dark:text-teal-400">
                  <Flame className="h-3 w-3" />
                  <span>Paling Cepat</span>
                </div>
                <p className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {evaluation.fastest
                    ? !trialStatus.canUsePremiumFeatures && !evaluation.fastest.profile.isOfficialDefault
                      ? `🔒 ${MONETIZATION_CONFIG.pricing.lifetimeLabel}`
                      : evaluation.fastest.profile.apn
                    : '—'}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {evaluation.fastest?.avgDownloadMbps !== null &&
                  evaluation.fastest?.avgDownloadMbps !== undefined
                    ? `${formatSpeed(evaluation.fastest.avgDownloadMbps, unit)} ${unit}`
                    : `Indeks ${evaluation.fastest?.effectiveSpeedScore || 0}%`}
                </p>
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-white/80 p-2.5 dark:bg-slate-900/80">
                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 uppercase dark:text-sky-400">
                  <Shield className="h-3 w-3" />
                  <span>Paling Stabil</span>
                </div>
                <p className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white">
                  {evaluation.mostStable
                    ? !trialStatus.canUsePremiumFeatures && !evaluation.mostStable.profile.isOfficialDefault
                      ? `🔒 ${MONETIZATION_CONFIG.pricing.lifetimeLabel}`
                      : evaluation.mostStable.profile.apn
                    : '—'}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {evaluation.mostStable?.avgPingMs !== null &&
                  evaluation.mostStable?.avgPingMs !== undefined
                    ? `Ping ${Math.round(evaluation.mostStable.avgPingMs)} ms`
                    : `Stabilitas ${evaluation.mostStable?.effectiveStabilityScore || 0}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currently Tagged APN Bar for Speedtest Benchmarking */}
      <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2.5 text-xs">
          <Sliders className="h-4 w-4 shrink-0 text-teal-500" />
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Profil APN yang ditandai untuk pengujian berikutnya:{' '}
            </span>
            <strong className="text-slate-900 dark:text-white">
              {activeProfileObj
                ? `${activeProfileObj.name} (APN: ${
                    !trialStatus.canUsePremiumFeatures && !activeProfileObj.isOfficialDefault
                      ? `🔒 ${MONETIZATION_CONFIG.pricing.lifetimeLabel}`
                      : activeProfileObj.apn
                  })`
                : 'Default Sistem'}
            </strong>
          </div>
        </div>

        <button
          type="button"
          disabled={isRunning}
          onClick={() => {
            if (!trialStatus.canUsePremiumFeatures) {
              onOpenPricing();
              return;
            }
            onStartSpeedtestNow();
          }}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            isRunning
              ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800'
              : !trialStatus.canUsePremiumFeatures
              ? 'cursor-pointer bg-amber-500 text-white hover:bg-amber-600'
              : 'cursor-pointer bg-teal-600 text-white hover:bg-teal-500'
          }`}
        >
          {!trialStatus.canUsePremiumFeatures ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span>
            {isRunning
              ? 'Sedang Menguji...'
              : !trialStatus.canUsePremiumFeatures
              ? `Buka ${MONETIZATION_CONFIG.pricing.lifetimeLabel} untuk Uji`
              : 'Uji Kecepatan APN Ini'}
          </span>
        </button>
      </div>

      {/* APN Profiles Cards Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {evaluation.ranked.map((item, rankIdx) => {
          const { profile } = item;
          const isSelected = profile.id === activeApnId;
          const isTopWinner = rankIdx === 0;
          const isLockedProfile = !trialStatus.canUsePremiumFeatures && !profile.isOfficialDefault;

          return (
            <div
              key={profile.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/[0.05] ring-1 ring-teal-500/30'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/35 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top Badges & Title */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isTopWinner && (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          #1 REKOMENDASI
                        </span>
                      )}
                      {profile.isOfficialDefault && (
                        <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          DEFAULT RESMI
                        </span>
                      )}
                      {profile.isCustom && (
                        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                          APN KUSTOM
                        </span>
                      )}
                      {item.testCount > 0 && (
                        <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                          TERUJI {item.testCount}x
                        </span>
                      )}
                    </div>

                    <h4 className="mt-1.5 font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {profile.name}
                    </h4>
                  </div>

                  {/* Radio button to mark active APN */}
                  <button
                    type="button"
                    onClick={() => onSelectActiveApn(profile.id)}
                    className={`shrink-0 cursor-pointer rounded-xl border px-2.5 py-1 text-[11px] font-bold transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-500/40 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ Dipakai Uji' : 'Pilih Uji'}
                  </button>
                </div>

                {/* Technical Parameter Pills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono-tabular text-[11px]">
                  <span className="rounded-lg border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 font-bold text-teal-700 dark:text-teal-300">
                    APN: {isLockedProfile ? `🔒 ${MONETIZATION_CONFIG.pricing.lifetimeLabel}` : profile.apn}
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
                    {profile.protocol}
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
                    {profile.apnType}
                  </span>
                  {profile.bearer !== 'Unspecified' && (
                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
                      {profile.bearer}
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {profile.summary}
                </p>
                <p className="mt-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">
                  Cocok untuk: {profile.bestFor}
                </p>
              </div>

              {/* Speed & Stability Bars OR Empirical Results */}
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                {item.testCount > 0 && item.avgDownloadMbps !== null ? (
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 font-mono-tabular text-xs dark:bg-slate-950/60">
                    <div>
                      <span className="block text-[10px] text-slate-400">Rata Unduh</span>
                      <strong className="text-teal-600 dark:text-teal-400">
                        {formatSpeed(item.avgDownloadMbps, unit)} {unit}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Rata Unggah</span>
                      <strong className="text-sky-600 dark:text-sky-400">
                        {formatSpeed(item.avgUploadMbps || 0, unit)} {unit}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Ping / Jitter</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {Math.round(item.avgPingMs || 0)} ms{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ±{item.avgJitterMs}
                        </span>
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Potensi Kecepatan
                        </span>
                        <span className="font-mono-tabular font-bold text-teal-600 dark:text-teal-400">
                          {item.effectiveSpeedScore}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${item.effectiveSpeedScore}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Stabilitas Ping
                        </span>
                        <span className="font-mono-tabular font-bold text-sky-600 dark:text-sky-400">
                          {item.effectiveStabilityScore}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${item.effectiveStabilityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTriggerAndroidApn(profile)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      {isLockedProfile ? (
                        <Lock className="h-3 w-3 text-amber-400" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      <span>{isLockedProfile ? 'Buka & Terapkan' : 'Terapkan ke HP'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyProfile(profile)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-teal-500/40 hover:text-teal-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {copiedId === profile.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Disalin</span>
                        </>
                      ) : isLockedProfile ? (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>Salin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isLockedProfile) {
                          onOpenPricing();
                          return;
                        }
                        setInspectProfile(profile);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-sky-500/40 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {isLockedProfile ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <HelpCircle className="h-3 w-3" />
                      )}
                      <span>Detail</span>
                    </button>
                  </div>

                  {profile.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomApn(profile.id)}
                      title="Hapus APN Kustom"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE NEW APN / SMART RECIPE BUILDER                        */}
      {/* ===================================================================== */}
      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0E1526]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-teal-600 uppercase dark:text-teal-400">
                  Pembuat Profil APN • {CARRIER_CATALOG[selectedCarrier].name}
                </span>
                <h3 className="mt-0.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Buat atau Racik APN Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Instant Auto-Recipe Templates */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                Isi Otomatis dengan Racikan Pintar Juru (1-Klik):
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  {
                    focus: 'speed' as ApnFocusTag,
                    label: '⚡ Kecepatan Puncak',
                    desc: 'Dual-Stack 4G+/5G tanpa proxy',
                  },
                  {
                    focus: 'gaming' as ApnFocusTag,
                    label: '🎮 Gaming & Anti-Jitter',
                    desc: 'Kunci IPv4 murni & LTE stabil',
                  },
                  {
                    focus: 'hotspot' as ApnFocusTag,
                    label: '📡 Hotspot / Modem',
                    desc: 'Aktifkan flag DUN anti-putus',
                  },
                ].map(preset => (
                  <button
                    key={preset.focus}
                    type="button"
                    onClick={() => handleOpenCreatorWithRecipe(preset.focus)}
                    className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
                      formFocus === preset.focus
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-slate-200 bg-slate-50 hover:border-teal-500/40 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {preset.label}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveNewApn} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Profil APN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mis: Juru Gaming Telkomsel"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    APN (Nama Titik Akses) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mis: internet / aha / 3data"
                    value={formApn}
                    onChange={e => setFormApn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Protokol APN
                  </label>
                  <select
                    value={formProtocol}
                    onChange={e => setFormProtocol(e.target.value as ApnProtocol)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="IPv4/IPv6">IPv4/IPv6 (Dual-Stack Cepat)</option>
                    <option value="IPv4">IPv4 Murni (Stabil Gaming/NAT)</option>
                    <option value="IPv6">IPv6 Murni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jenis APN (APN Type)
                  </label>
                  <input
                    type="text"
                    value={formApnType}
                    onChange={e => setFormApnType(e.target.value)}
                    placeholder="default,supl"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Pengguna (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="Kosongkan jika tidak perlu"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kata Sandi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak perlu"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jenis Autentikasi
                  </label>
                  <select
                    value={formAuth}
                    onChange={e => setFormAuth(e.target.value as ApnAuthType)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="None">None (Tanpa Autentikasi)</option>
                    <option value="PAP or CHAP">PAP or CHAP (Direkomendasikan)</option>
                    <option value="PAP">PAP</option>
                    <option value="CHAP">CHAP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bearer / Pengunci Jaringan
                  </label>
                  <select
                    value={formBearer}
                    onChange={e => setFormBearer(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Unspecified">Unspecified (Otomatis 4G/5G)</option>
                    <option value="LTE">LTE (Kunci 4G Stabil)</option>
                    <option value="NR">NR (5G Only)</option>
                    <option value="LTE, NR">LTE + NR (4G/5G)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Proxy (Sebaiknya Dikosongkan)
                  </label>
                  <input
                    type="text"
                    value={formProxy}
                    onChange={e => setFormProxy(e.target.value)}
                    placeholder="Kosongkan untuk kecepatan penuh"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Port
                  </label>
                  <input
                    type="text"
                    value={formPort}
                    onChange={e => setFormPort(e.target.value)}
                    placeholder="Kosongkan"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-tabular text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {formProxy.trim() !== '' && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>Tips Kecepatan Juru:</strong> Mengisi IP Proxy pada jaringan 4G/5G modern sering kali membatasi bandwidth dan menambah ping. Kosongkan kolom Proxy &amp; Port kecuali diwajibkan jaringan korporat khusus.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Profil (Opsional)
                </label>
                <input
                  type="text"
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  placeholder="Catatan kegunaan APN ini..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreator(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-500"
                >
                  Simpan &amp; Pilih APN Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: INSPECT & APPLY APN TO ANDROID / IOS / MODEM                 */}
      {/* ===================================================================== */}
      {inspectProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0E1526]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-teal-600 uppercase dark:text-teal-400">
                  Panduan Pemasangan Parameter APN
                </span>
                <h3 className="mt-0.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  {inspectProfile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectProfile(null)}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/70">
              {[
                { label: 'Nama', val: inspectProfile.name },
                { label: 'APN', val: inspectProfile.apn },
                { label: 'Proxy', val: inspectProfile.proxy || 'Tidak disetel' },
                { label: 'Port', val: inspectProfile.port || 'Tidak disetel' },
                { label: 'Nama Pengguna', val: inspectProfile.username || 'Tidak disetel' },
                { label: 'Kata Sandi', val: inspectProfile.password || 'Tidak disetel' },
                { label: 'Jenis Autentikasi', val: inspectProfile.authType },
                { label: 'Jenis APN', val: inspectProfile.apnType },
                { label: 'Protokol APN', val: inspectProfile.protocol },
                { label: 'Protokol Roaming', val: inspectProfile.roamingProtocol },
                { label: 'Bearer', val: inspectProfile.bearer },
              ].map(row => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-none last:pb-0 dark:border-slate-800"
                >
                  <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              <strong>Cara Pasang &amp; Uji Akurat:</strong>
              <ol className="mt-1 list-inside list-decimal space-y-1">
                <li>
                  Klik <strong>Buka Pengaturan APN Android</strong> (atau buka Pengaturan &rarr; Jaringan Seluler &rarr; Nama Titik Akses &rarr; Tambah APN baru).
                </li>
                <li>Isi kolom sesuai tabel di atas, simpan, lalu pilih titik bulat APN tersebut.</li>
                <li>
                  Kembali ke <strong>Juru Speedtest</strong>, pastikan APN ini terpilih sebagai <em>Dipakai Uji</em>, lalu tekan <strong>Mulai Uji Sekarang</strong>!
                </li>
              </ol>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleTriggerAndroidApn(inspectProfile)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-500"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Pengaturan APN Android</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadIosMobileConfig(inspectProfile)}
                  title="Unduh Profil Konfigurasi APN untuk iOS / iPhone"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:border-sky-500/40 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Profil iOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyProfile(inspectProfile)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedId === inspectProfile.id ? 'Tersalin!' : 'Salin Semua'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

