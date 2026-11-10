import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Cpu,
  Eye,
  EyeOff,
  Gamepad2,
  Globe2,
  Info,
  MapPin,
  Server,
  Sparkles,
  Tv,
  Video,
} from 'lucide-react';
import type {
  ActivityRating,
  BufferbloatGrade,
  LatencyMetrics,
  NetworkDiagnosis,
  NetworkMeta,
} from '../types/speedtest';
import { maskIpAddress } from '../utils/networkDiagnostics';

interface NetworkDiagnosticsSectionProps {
  networkMeta: NetworkMeta | null;
  maskIp: boolean;
  onToggleMaskIp: () => void;
  latency: LatencyMetrics;
  diagnosis: NetworkDiagnosis | null;
}

function gradeBadgeStyles(grade: BufferbloatGrade): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300';
    case 'B':
      return 'border-teal-500/40 bg-teal-500/15 text-teal-600 dark:text-teal-300';
    case 'C':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300';
    default:
      return 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300';
  }
}

function tierBadgeStyles(tier: ActivityRating['tier']): string {
  switch (tier) {
    case 'Sangat Baik':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'Baik':
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
    case 'Cukup':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    default:
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
  }
}

function activityIcon(id: ActivityRating['id']) {
  switch (id) {
    case 'streaming':
      return <Tv className="h-4 w-4 text-teal-500" />;
    case 'videocall':
      return <Video className="h-4 w-4 text-sky-500" />;
    case 'gaming':
      return <Gamepad2 className="h-4 w-4 text-violet-500" />;
    case 'cloud':
      return <CloudUpload className="h-4 w-4 text-amber-500" />;
  }
}

export const NetworkDiagnosticsSection: React.FC<NetworkDiagnosticsSectionProps> = ({
  networkMeta,
  maskIp,
  onToggleMaskIp,
  latency,
  diagnosis,
}) => {
  const maxPingBar = Math.max(
    100,
    latency.unloadedMs || 0,
    latency.downloadLoadedMs || 0,
    latency.uploadLoadedMs || 0
  );

  return (
    <section className="mt-6 space-y-6">
      {/* Network & ISP Information Bar */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-[#0C1221]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-teal-500" />
            <h2 className="font-display text-sm font-extrabold tracking-wide text-slate-900 uppercase dark:text-white">
              Identitas Jaringan &amp; Titik Server Edge
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggleMaskIp}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-500/40 hover:text-teal-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-teal-300"
          >
            {maskIp ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{maskIp ? 'Tampilkan IP' : 'Samarkan IP'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Provider / ISP Aktif
              </span>
              {networkMeta && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                    networkMeta.isCellularIsp
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                      : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  }`}
                >
                  {networkMeta.isCellularIsp ? 'Kartu Seluler' : 'Wi-Fi / Fiber'}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
              {networkMeta?.isp || 'Mendeteksi ISP...'}
            </p>
            <p className="mt-0.5 font-mono-tabular text-[11px] text-slate-500">
              {networkMeta?.asn || 'ASN Otomatis'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              IP Publik &amp; Radio Jaringan
            </span>
            <p className="mt-1 truncate font-mono-tabular text-sm font-bold text-slate-900 dark:text-white">
              {networkMeta
                ? maskIp
                  ? maskIpAddress(networkMeta.ip)
                  : networkMeta.ip
                : '•••.•••.•••.•••'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {networkMeta?.ipVersion || 'IPv4'}
              {networkMeta?.connectionType ? ` • ${networkMeta.connectionType}` : ''}
              {networkMeta?.downlinkHintMbps
                ? ` • ~${networkMeta.downlinkHintMbps} Mbps`
                : ''}
              {networkMeta?.rttHintMs ? ` (${networkMeta.rttHintMs}ms)` : ''}
              {networkMeta?.saveData ? ' • Penghemat Data Aktif' : ''}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 text-teal-500" />
              Lokasi Gateway IP
            </span>
            <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
              {networkMeta ? `${networkMeta.city}, ${networkMeta.countryCode}` : 'Indonesia'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {networkMeta?.region || networkMeta?.country || 'Routing Domestik/Global'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/50">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Server className="h-3 w-3 text-sky-500" />
              Server Uji Edge Indonesia
            </span>
            <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
              {networkMeta && networkMeta.coloCode !== 'EDGE'
                ? `Cloudflare (${networkMeta.coloCode})`
                : 'Cloudflare Edge'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {networkMeta?.coloCity || 'Anycast Terdekat'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Diagnosis & Bufferbloat Section (Visible when results exist) */}
      {diagnosis && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 5 cols: Bufferbloat & Smart Summary */}
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 lg:col-span-5 dark:border-slate-800/90 dark:bg-[#0C1221]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-teal-600 uppercase dark:text-teal-400">
                  <Cpu className="h-4 w-4" />
                  Uji Bufferbloat &amp; Kestabilan
                </span>
                <h3 className="mt-1 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  {diagnosis.headline}
                </h3>
              </div>
              <div
                className={`flex flex-col items-center rounded-2xl border px-3.5 py-2 ${gradeBadgeStyles(
                  diagnosis.bufferbloatGrade
                )}`}
              >
                <span className="text-[10px] font-bold uppercase opacity-80">Grade</span>
                <span className="font-mono-tabular text-2xl font-extrabold leading-none">
                  {diagnosis.bufferbloatGrade}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {diagnosis.summary}
            </p>

            {/* Visual Latency Under Load Comparison Bars */}
            <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Perbandingan Latensi (Ping)</span>
                <span className="font-mono-tabular text-teal-600 dark:text-teal-400">
                  +{diagnosis.bufferbloatDeltaMs} ms saat beban
                </span>
              </div>

              {[
                {
                  label: 'Tanpa Beban (Idle)',
                  val: latency.unloadedMs,
                  barClass: 'bg-emerald-500',
                },
                {
                  label: 'Saat Unduh Penuh',
                  val: latency.downloadLoadedMs,
                  barClass: 'bg-teal-500',
                },
                {
                  label: 'Saat Unggah Penuh',
                  val: latency.uploadLoadedMs,
                  barClass: 'bg-sky-500',
                },
              ].map(row => {
                const ms = row.val ? Math.round(row.val) : 0;
                const widthPct =
                  ms > 0 ? Math.max(8, Math.min(100, (ms / maxPingBar) * 100)) : 0;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                      <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                        {ms > 0 ? `${ms} ms` : '—'}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${row.barClass}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FUP & Throttling Detector Card */}
            <div
              className={`rounded-2xl border p-3.5 ${
                diagnosis.fupAnalysis.isSuspectedFup
                  ? 'border-amber-500/45 bg-amber-500/10'
                  : 'border-emerald-500/30 bg-emerald-500/[0.06]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {diagnosis.fupAnalysis.isSuspectedFup ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {diagnosis.fupAnalysis.headline}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {diagnosis.fupAnalysis.detail}
                  </p>
                  {diagnosis.fupAnalysis.isSuspectedFup && (
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Solusi: {diagnosis.fupAnalysis.remedy}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actionable Tips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Rekomendasi Diagnostik Juru</span>
              </div>
              {diagnosis.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 cols: Activity Readiness Matrix */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 lg:col-span-7 dark:border-slate-800/90 dark:bg-[#0C1221]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider text-sky-600 uppercase dark:text-sky-400">
                  Indeks Kelayakan Aktivitas
                </span>
                <h3 className="mt-0.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Kesiapan Jaringan untuk Kebutuhan Harian
                </h3>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-violet-500 uppercase">
                    Skor Game
                  </span>
                  <p className="font-mono-tabular text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                    {diagnosis.gamingScore}
                    <span className="text-xs font-semibold text-slate-400">/100</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Skor Juru
                  </span>
                  <p className="font-mono-tabular text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                    {diagnosis.overallScore}
                    <span className="text-xs font-semibold text-slate-400">/100</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {diagnosis.activities.map(act => (
                <div
                  key={act.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/45"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                          {activityIcon(act.id)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {act.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {act.subtitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tierBadgeStyles(
                          act.tier
                        )}`}
                      >
                        {act.tier}
                      </span>
                    </div>

                    <p className="mt-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {act.detail}
                    </p>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between font-mono-tabular text-[10px] font-semibold text-slate-400">
                      <span>Kualitas</span>
                      <span>{act.score}/100</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500"
                        style={{ width: `${act.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

