import React from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import type {
  LatencyMetrics,
  SpeedSample,
  SpeedUnit,
  TestPhase,
} from '../types/speedtest';
import { formatBytes, formatSpeed } from '../utils/networkDiagnostics';

interface LiveThroughputChartProps {
  phase: TestPhase;
  unit: SpeedUnit;
  downloadMbps: number;
  downloadPeakMbps: number;
  downloadBytes: number;
  uploadMbps: number;
  uploadPeakMbps: number;
  uploadBytes: number;
  latency: LatencyMetrics;
  downloadSeries: SpeedSample[];
  uploadSeries: SpeedSample[];
  downloadDurationMs: number;
  uploadDurationMs: number;
}

function buildAreaAndLinePath(
  series: SpeedSample[],
  maxTimeMs: number,
  maxMbps: number,
  width: number,
  height: number,
  padTop = 10,
  padBottom = 6
): { line: string; area: string } {
  if (series.length === 0) return { line: '', area: '' };
  const usableH = height - padTop - padBottom;
  const safeMaxMbps = Math.max(5, maxMbps * 1.12);
  const safeMaxTime = Math.max(1000, maxTimeMs);

  const pts = series.map(s => {
    const x = Math.min(width, Math.max(0, (s.elapsedMs / safeMaxTime) * width));
    const y =
      padTop + usableH - Math.min(usableH, Math.max(0, (s.mbps / safeMaxMbps) * usableH));
    return { x, y };
  });

  if (pts.length === 1) {
    const p = pts[0];
    return {
      line: `M 0 ${p.y.toFixed(1)} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      area: `M 0 ${(height - padBottom).toFixed(1)} L 0 ${p.y.toFixed(
        1
      )} L ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${p.x.toFixed(1)} ${(
        height - padBottom
      ).toFixed(1)} Z`,
    };
  }

  let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const midX = ((prev.x + curr.x) / 2).toFixed(1);
    line += ` C ${midX} ${prev.y.toFixed(1)}, ${midX} ${curr.y.toFixed(
      1
    )}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  const first = pts[0];
  const last = pts[pts.length - 1];
  const baseline = (height - padBottom).toFixed(1);
  const area = `${line} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(
    1
  )} ${baseline} Z`;

  return { line, area };
}

export const LiveThroughputChart: React.FC<LiveThroughputChartProps> = ({
  phase,
  unit,
  downloadMbps,
  downloadPeakMbps,
  downloadBytes,
  uploadMbps,
  uploadPeakMbps,
  uploadBytes,
  latency,
  downloadSeries,
  uploadSeries,
  downloadDurationMs,
  uploadDurationMs,
}) => {
  const maxSpeedObserved = Math.max(
    10,
    ...downloadSeries.map(s => s.mbps),
    ...uploadSeries.map(s => s.mbps)
  );

  const chartW = 540;
  const chartH = 128;

  const dlPaths = buildAreaAndLinePath(
    downloadSeries,
    downloadDurationMs,
    maxSpeedObserved,
    chartW,
    chartH
  );
  const ulPaths = buildAreaAndLinePath(
    uploadSeries,
    uploadDurationMs,
    maxSpeedObserved,
    chartW,
    chartH
  );

  const totalBytes = downloadBytes + uploadBytes;

  const stages = [
    {
      key: 'ping',
      label: 'Ping & Jitter',
      done:
        phase === 'download' || phase === 'upload' || phase === 'complete',
      active: phase === 'init' || phase === 'ping',
    },
    {
      key: 'download',
      label: 'Unduh (Download)',
      done: phase === 'upload' || phase === 'complete',
      active: phase === 'download',
    },
    {
      key: 'upload',
      label: 'Unggah (Upload)',
      done: phase === 'complete',
      active: phase === 'upload',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Primary KPI Cards: Download & Upload */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* Download Card */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            phase === 'download'
              ? 'border-teal-500/60 bg-teal-500/[0.06] shadow-md shadow-teal-500/10'
              : 'border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-[#0C1221]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-teal-600 uppercase dark:text-teal-400">
              <ArrowDownToLine className="h-4 w-4" />
              Download
            </span>
            <span className="font-mono-tabular text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {downloadPeakMbps > 0
                ? `Puncak ${formatSpeed(downloadPeakMbps, unit)} ${unit}`
                : '—'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {downloadMbps > 0 ? formatSpeed(downloadMbps, unit) : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Ping Beban:{' '}
              <strong className="font-mono-tabular text-slate-700 dark:text-slate-200">
                {latency.downloadLoadedMs
                  ? `${Math.round(latency.downloadLoadedMs)} ms`
                  : '—'}
              </strong>
            </span>
            <span className="font-mono-tabular">{formatBytes(downloadBytes)}</span>
          </div>
        </div>

        {/* Upload Card */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            phase === 'upload'
              ? 'border-sky-500/60 bg-sky-500/[0.06] shadow-md shadow-sky-500/10'
              : 'border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-[#0C1221]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-sky-600 uppercase dark:text-sky-400">
              <ArrowUpFromLine className="h-4 w-4" />
              Upload
            </span>
            <span className="font-mono-tabular text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {uploadPeakMbps > 0
                ? `Puncak ${formatSpeed(uploadPeakMbps, unit)} ${unit}`
                : '—'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {uploadMbps > 0 ? formatSpeed(uploadMbps, unit) : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Ping Beban:{' '}
              <strong className="font-mono-tabular text-slate-700 dark:text-slate-200">
                {latency.uploadLoadedMs
                  ? `${Math.round(latency.uploadLoadedMs)} ms`
                  : '—'}
              </strong>
            </span>
            <span className="font-mono-tabular">{formatBytes(uploadBytes)}</span>
          </div>
        </div>
      </div>

      {/* Latency Trio Row: Unloaded Ping, Jitter, Packet Loss */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 dark:border-slate-800/90 dark:bg-[#0C1221]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Ping Dasar</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white">
              {latency.unloadedMs > 0 ? Math.round(latency.unloadedMs) : '—'}
            </span>
            <span className="text-[11px] text-slate-500">ms</span>
          </div>
          <p className="mt-1 font-mono-tabular text-[10px] text-slate-400">
            {latency.minMs > 0
              ? `Min ${Math.round(latency.minMs)} • Maks ${Math.round(latency.maxMs)}`
              : 'Tanpa beban'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 dark:border-slate-800/90 dark:bg-[#0C1221]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <span>Jitter</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white">
              {latency.samples.length > 1 ? latency.jitterMs.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-slate-500">ms</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {latency.samples.length > 1
              ? latency.jitterMs <= 8
                ? 'Sangat stabil'
                : latency.jitterMs <= 20
                ? 'Fluktuasi wajar'
                : 'Fluktuasi tinggi'
              : 'Variasi latensi'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 dark:border-slate-800/90 dark:bg-[#0C1221]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
            <span>Packet Loss</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white">
              {latency.samples.length > 0 ? latency.packetLossPct.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-slate-500">%</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {latency.samples.length > 0
              ? latency.packetLossPct === 0
                ? '0 paket hilang'
                : 'Ada paket gagal'
              : 'Uji keutuhan'}
          </p>
        </div>
      </div>

      {/* Real-Time Dual Telemetry Curve + Pipeline Stepper */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800/90 dark:bg-[#0C1221]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-500" />
            <span className="text-xs font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
              Grafik Throughput Real-Time
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Unduh
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Unggah
            </span>
            <span className="font-mono-tabular text-slate-400">
              Total Data: {formatBytes(totalBytes)}
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/60">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="dlChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="ulChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Reference Lines */}
            {[0.25, 0.5, 0.75].map(r => (
              <line
                key={r}
                x1={0}
                y1={chartH * r}
                x2={chartW}
                y2={chartH * r}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-200 dark:text-slate-800/80"
                strokeWidth="1"
              />
            ))}

            {dlPaths.area && <path d={dlPaths.area} fill="url(#dlChartFill)" />}
            {dlPaths.line && (
              <path
                d={dlPaths.line}
                fill="none"
                stroke="#14B8A6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {ulPaths.area && <path d={ulPaths.area} fill="url(#ulChartFill)" />}
            {ulPaths.line && (
              <path
                d={ulPaths.line}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {downloadSeries.length === 0 && uploadSeries.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400 dark:text-slate-500">
              {phase === 'ping' || phase === 'init'
                ? `Mengukur sampel ping (${latency.samples.length} sampel)...`
                : 'Kurva kecepatan unduh & unggah real-time akan tampil di sini'}
            </div>
          )}
        </div>

        {/* Pipeline Stage Stepper */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {stages.map(st => (
            <div
              key={st.key}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                st.active
                  ? 'border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                  : st.done
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200/70 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500'
              }`}
            >
              {st.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : st.active ? (
                <span className="h-2 w-2 shrink-0 animate-ping rounded-full bg-teal-400" />
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
              <span className="truncate">{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

