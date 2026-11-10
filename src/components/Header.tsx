import React from 'react';
import {
  Activity,
  Crown,
  Gauge,
  Lock,
  MapPin,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import type {
  NetworkMeta,
  SpeedUnit,
  TestProfileId,
} from '../types/speedtest';
import { TEST_PROFILES } from '../utils/networkDiagnostics';
import type { TrialQuotaStatus } from '../utils/plan';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  profileId: TestProfileId;
  onChangeProfile: (id: TestProfileId) => void;
  unit: SpeedUnit;
  onChangeUnit: (unit: SpeedUnit) => void;
  networkMeta: NetworkMeta | null;
  isRunning: boolean;
  trialStatus: TrialQuotaStatus;
  onOpenPricing: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  profileId,
  onChangeProfile,
  unit,
  onChangeUnit,
  networkMeta,
  isRunning,
  trialStatus,
  onOpenPricing,
  onNavigateHome,
}) => {
  const profiles = Object.values(TEST_PROFILES);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#070B14]/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Identity */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex cursor-pointer items-center gap-3 text-left"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg shadow-teal-500/20">
            <Gauge className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRunning ? 'animate-ping bg-emerald-400' : 'bg-teal-400/50'
                }`}
              />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#070B14]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Juru<span className="text-teal-600 dark:text-teal-400">Speedtest</span>
              </span>
              {networkMeta?.city && (
                <span className="hidden items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 sm:inline-flex dark:text-teal-300">
                  <MapPin className="h-3 w-3" />
                  Area: {networkMeta.city}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cek Kecepatan Area • Rekomendasi APN Cepat &amp; Stabil
            </p>
          </div>
        </button>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced Test Profile Selector (Pro Locked for Free Users) */}
          <div
            className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900"
            role="group"
            aria-label="Mode Pengujian (Advanced)"
          >
            {profiles.map(p => {
              const active = p.id === profileId;
              const isLockedProfile = !trialStatus.isPro && p.id !== 'standard';
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isRunning}
                  title={
                    isLockedProfile
                      ? `${p.label}: Fitur Advanced Pro (${MONETIZATION_CONFIG.pricing.lifetimeLabel})`
                      : p.description
                  }
                  onClick={() => {
                    if (isLockedProfile) {
                      onOpenPricing();
                      return;
                    }
                    onChangeProfile(p.id);
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-teal-700 shadow-xs dark:bg-slate-800 dark:text-teal-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  } ${isRunning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  {isLockedProfile && <Lock className="h-3 w-3 text-amber-500" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Unit Toggle (Mbps / MB/s) */}
          <button
            type="button"
            onClick={() => onChangeUnit(unit === 'Mbps' ? 'MB/s' : 'Mbps')}
            title="Ubah satuan kecepatan (Megabit vs Megabyte per detik)"
            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-500/40 hover:text-teal-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-500/40 dark:hover:text-teal-300"
          >
            <Activity className="h-3.5 w-3.5 text-teal-500" />
            <span className="font-mono-tabular">{unit}</span>
          </button>

          {/* Trial / Lifetime Pro Button */}
          <button
            type="button"
            onClick={onOpenPricing}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              trialStatus.isPro
                ? 'border border-amber-400/50 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : trialStatus.isTrialExhausted
                ? 'bg-amber-500 text-slate-950 shadow-xs hover:bg-amber-400'
                : 'border border-teal-500/40 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300'
            }`}
          >
            {trialStatus.isPro ? (
              <>
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>PRO AKTIF</span>
              </>
            ) : trialStatus.isTrialExhausted ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Buka Pro {MONETIZATION_CONFIG.pricing.lifetimeLabel}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Gratis {trialStatus.trialsRemaining}/{trialStatus.effectiveTrialLimit} • Pro{' '}
                  {MONETIZATION_CONFIG.pricing.lifetimeLabel}
                </span>
              </>
            )}
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Ubah Tema Terang/Gelap"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
