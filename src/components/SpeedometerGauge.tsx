import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Wifi,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import type { OptimizationModeChoice, SpeedUnit, TestPhase } from '../types/speedtest';
import { convertSpeed, formatSpeed } from '../utils/networkDiagnostics';
import type { TrialQuotaStatus } from '../utils/plan';

interface SpeedometerGaugeProps {
  phase: TestPhase;
  gaugeMbps: number;
  unit: SpeedUnit;
  pingMs: number;
  overallProgress: number;
  hasBaseline: boolean;
  chosenMode: OptimizationModeChoice;
  activeApnCode?: string;
  trialStatus: TrialQuotaStatus;
  onStart: () => void;
  onAbort: () => void;
  onOpenPricing: () => void;
}

const SCALE_MARKS_MBPS = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000];

function mbpsToNormalizedProgress(mbps: number): number {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0;
  const maxMark = SCALE_MARKS_MBPS[SCALE_MARKS_MBPS.length - 1];
  if (mbps >= maxMark) return 1;

  const segments = SCALE_MARKS_MBPS.length - 1;
  for (let i = 0; i < segments; i++) {
    const low = SCALE_MARKS_MBPS[i];
    const high = SCALE_MARKS_MBPS[i + 1];
    if (mbps >= low && mbps <= high) {
      const localRatio = (mbps - low) / (high - low);
      return (i + localRatio) / segments;
    }
  }
  return 1;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  phase,
  gaugeMbps,
  unit,
  pingMs,
  overallProgress,
  hasBaseline,
  chosenMode,
  activeApnCode,
  trialStatus,
  onStart,
  onAbort,
  onOpenPricing,
}) => {
  const isRunning =
    phase === 'init' || phase === 'ping' || phase === 'download' || phase === 'upload';

  const cx = 210;
  const cy = 200;
  const radius = 154;

  const startDeg = 135;
  const sweepDeg = 270;

  const polarPoint = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const arcStart = polarPoint(startDeg, radius);
  const arcEnd = polarPoint(startDeg + sweepDeg, radius);
  const fullArcPath = `M ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(
    2
  )} A ${radius} ${radius} 0 1 1 ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`;

  const progress =
    phase === 'ping' || phase === 'init'
      ? Math.min(0.12, (overallProgress / 20) * 0.12)
      : mbpsToNormalizedProgress(gaugeMbps);

  const needleDeg = startDeg + progress * sweepDeg;
  const tipPoint = polarPoint(needleDeg, radius);
  const needleInner = polarPoint(needleDeg, 54);
  const needleOuter = polarPoint(needleDeg, radius - 14);

  const isUpload = phase === 'upload';
  const phaseBadge = (() => {
    switch (phase) {
      case 'init':
        return { text: 'MENGHUBUNGKAN EDGE INDONESIA...', color: 'text-teal-400' };
      case 'ping':
        return { text: 'MENGUJI PING & JITTER GAME', color: 'text-amber-400' };
      case 'download':
        return { text: 'MENGUKUR KECEPATAN UNDUH', color: 'text-teal-400' };
      case 'upload':
        return { text: 'MENGUKUR KECEPATAN UNGGAH', color: 'text-sky-400' };
      case 'complete':
        return { text: 'PENGUJIAN SELESAI', color: 'text-emerald-400' };
      case 'aborted':
        return { text: 'PENGUJIAN DIBATALKAN', color: 'text-slate-400' };
      case 'error':
        return { text: 'GANGGUAN JARINGAN', color: 'text-rose-400' };
      default:
        return hasBaseline
          ? {
              text:
                chosenMode === 'gaming'
                  ? `SIAP BANDINGKAN • MODE STABIL (${activeApnCode || 'APN'})`
                  : `SIAP BANDINGKAN • MODE CEPAT (${activeApnCode || 'APN'})`,
              color: 'text-teal-500 dark:text-teal-300',
            }
          : {
              text: 'LANGKAH 1: CEK KECEPATAN & AREA SEKARANG',
              color: 'text-amber-600 dark:text-amber-400',
            };
    }
  })();

  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-[#0C1221]">
      {/* Top Status Pill */}
      <div className="mb-1 flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800 dark:bg-slate-900/90">
        {phase === 'download' && <ArrowDown className="h-3.5 w-3.5 animate-bounce text-teal-500" />}
        {phase === 'upload' && <ArrowUp className="h-3.5 w-3.5 animate-bounce text-sky-400" />}
        {(phase === 'ping' || phase === 'init') && (
          <Wifi className="h-3.5 w-3.5 animate-pulse text-amber-400" />
        )}
        <span className={phaseBadge.color}>{phaseBadge.text}</span>
      </div>

      {/* Radial SVG Instrument */}
      <div className="relative w-full max-w-[390px]">
        <svg viewBox="0 0 420 355" className="h-auto w-full overflow-visible select-none">
          <defs>
            <linearGradient id="dlArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="55%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="ulArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="55%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path
            d={fullArcPath}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/60"
            strokeWidth="22"
            strokeLinecap="round"
          />

          <path
            d={fullArcPath}
            fill="none"
            pathLength={1000}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="14"
            strokeLinecap="round"
          />

          <path
            d={fullArcPath}
            fill="none"
            pathLength={1000}
            stroke={isUpload ? 'url(#ulArcGrad)' : 'url(#dlArcGrad)'}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0.5, progress * 1000)} 1000`}
            filter="url(#arcGlow)"
            className="transition-[stroke-dasharray] duration-150 ease-out"
          />

          {SCALE_MARKS_MBPS.map((markMbps, idx) => {
            const ratio = idx / (SCALE_MARKS_MBPS.length - 1);
            const deg = startDeg + ratio * sweepDeg;
            const outerTick = polarPoint(deg, radius - 18);
            const innerTick = polarPoint(deg, radius - 28);
            const labelPos = polarPoint(deg, radius - 46);
            const passed = progress >= ratio - 0.005 && (isRunning || phase === 'complete');

            const shownLabel =
              unit === 'MB/s'
                ? markMbps === 0
                  ? '0'
                  : markMbps >= 8
                  ? String(Math.round(convertSpeed(markMbps, 'MB/s')))
                  : convertSpeed(markMbps, 'MB/s').toFixed(1)
                : markMbps === 1000
                ? '1G'
                : String(markMbps);

            return (
              <g key={markMbps}>
                <line
                  x1={outerTick.x}
                  y1={outerTick.y}
                  x2={innerTick.x}
                  y2={innerTick.y}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={
                    passed
                      ? isUpload
                        ? 'text-sky-400'
                        : 'text-teal-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`font-mono-tabular text-[11px] font-semibold transition-colors ${
                    passed
                      ? 'fill-slate-900 dark:fill-slate-100'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {shownLabel}
                </text>
              </g>
            );
          })}

          {(isRunning || phase === 'complete') && (
            <g className="transition-all duration-150 ease-out">
              <line
                x1={needleInner.x}
                y1={needleInner.y}
                x2={needleOuter.x}
                y2={needleOuter.y}
                stroke={isUpload ? '#38BDF8' : '#2DD4BF'}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.55"
              />
              <circle
                cx={tipPoint.x}
                cy={tipPoint.y}
                r="7"
                fill={isUpload ? '#38BDF8' : '#2DD4BF'}
              />
              <circle cx={tipPoint.x} cy={tipPoint.y} r="3.2" fill="#FFFFFF" />
            </g>
          )}

          <g>
            {phase === 'ping' || phase === 'init' ? (
              <>
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  className="font-mono-tabular fill-slate-900 text-[48px] font-bold tracking-tight dark:fill-white"
                >
                  {pingMs > 0 ? Math.round(pingMs) : '•••'}
                </text>
                <text
                  x={cx}
                  y={cy + 28}
                  textAnchor="middle"
                  className="fill-amber-600 text-[13px] font-bold tracking-widest uppercase dark:fill-amber-400"
                >
                  {pingMs > 0 ? 'ms Ping' : 'Menyiapkan'}
                </text>
              </>
            ) : (
              <>
                <text
                  x={cx}
                  y={cy - 2}
                  textAnchor="middle"
                  className="font-mono-tabular fill-slate-900 text-[54px] font-bold tracking-tight dark:fill-white"
                >
                  {phase === 'idle' ? '0.00' : formatSpeed(gaugeMbps, unit)}
                </text>
                <text
                  x={cx}
                  y={cy + 30}
                  textAnchor="middle"
                  className={`text-[13px] font-bold tracking-widest uppercase ${
                    isUpload
                      ? 'fill-sky-600 dark:fill-sky-400'
                      : 'fill-teal-600 dark:fill-teal-400'
                  }`}
                >
                  {unit} {phase === 'complete' ? '(Unduh)' : ''}
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Primary Action Button Positioned Cleanly in Gauge Base */}
        <div className="-mt-8 flex flex-col items-center justify-center gap-2">
          {!isRunning ? (
            trialStatus.isTrialExhausted ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="group relative inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-6 py-3.5 text-xs font-extrabold tracking-wide text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] sm:text-sm"
              >
                <Lock className="h-4 w-4" />
                <span>
                  BUKA SELAMANYA ({MONETIZATION_CONFIG.pricing.lifetimeLabel})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                className="group relative inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-sky-500 px-7 py-3.5 text-xs font-extrabold tracking-wide text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/35 active:scale-[0.98] sm:text-sm"
              >
                {hasBaseline ? (
                  <>
                    <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
                    <span>
                      BANDINGKAN DENGAN YANG SEKARANG
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>MULAI CEK KECEPATAN SEKARANG</span>
                  </>
                )}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onAbort}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-rose-500/35 bg-rose-500/10 px-6 py-3 text-xs font-bold tracking-wider text-rose-600 uppercase transition hover:bg-rose-500/20 dark:text-rose-300"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Batalkan ({overallProgress}%)</span>
            </button>
          )}

          {/* Trial Quota Micro-Badge below Button */}
          <div className="text-center text-[11px] font-semibold">
            {trialStatus.isPro ? (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Crown className="h-3 w-3" />
                <span>Akses Tanpa Batas Aktif Selamanya</span>
              </span>
            ) : trialStatus.isTrialExhausted ? (
              <span className="text-amber-700 dark:text-amber-300">
                {trialStatus.effectiveTrialLimit}/{trialStatus.effectiveTrialLimit} uji gratis selesai • Sekali bayar {MONETIZATION_CONFIG.pricing.lifetimeLabel} aktif selamanya
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Sparkles className="h-3 w-3 text-teal-500" />
                <span>
                  Coba Gratis: sisa <strong className="text-slate-800 dark:text-slate-200">{trialStatus.trialsRemaining}x</strong> dari {trialStatus.effectiveTrialLimit}x uji penuh
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
