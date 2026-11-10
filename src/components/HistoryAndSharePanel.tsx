import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileWarning,
  History,
  MessageCircle,
  Trash2,
  X,
} from 'lucide-react';
import type { SpeedUnit, SpeedtestHistoryEntry } from '../types/speedtest';
import {
  downloadResultCardPng,
  formatBytes,
  formatSpeed,
  generateIspComplaintText,
  TEST_PROFILES,
} from '../utils/networkDiagnostics';

interface HistoryAndSharePanelProps {
  latestEntry: SpeedtestHistoryEntry | null;
  history: SpeedtestHistoryEntry[];
  unit: SpeedUnit;
  maskIp: boolean;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryAndSharePanel: React.FC<HistoryAndSharePanelProps> = ({
  latestEntry,
  history,
  unit,
  maskIp,
  onDeleteEntry,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [complaintEntry, setComplaintEntry] = useState<SpeedtestHistoryEntry | null>(null);
  const [copiedComplaint, setCopiedComplaint] = useState(false);

  const handleCopySummary = async () => {
    if (!latestEntry) return;
    const text = [
      `📊 Hasil Uji Juru Speedtest`,
      `• Download: ${latestEntry.downloadMbps.toFixed(2)} Mbps (Puncak ${latestEntry.downloadPeakMbps.toFixed(1)} Mbps)`,
      `• Upload: ${latestEntry.uploadMbps.toFixed(2)} Mbps (Puncak ${latestEntry.uploadPeakMbps.toFixed(1)} Mbps)`,
      `• Ping: ${Math.round(latestEntry.pingMs)} ms | Jitter: ${latestEntry.jitterMs.toFixed(1)} ms | Loss: ${latestEntry.packetLossPct.toFixed(1)}%`,
      `• Bufferbloat: Grade ${latestEntry.bufferbloatGrade} | Skor Juru: ${latestEntry.overallScore}/100${
        typeof latestEntry.gamingScore === 'number'
          ? ` | Skor Game: ${latestEntry.gamingScore}/100`
          : ''
      }`,
      `• ISP: ${latestEntry.isp} (${latestEntry.city}) • Edge: Cloudflare ${latestEntry.coloCode}`,
      ...(latestEntry.apnValue
        ? [`• Profil APN: ${latestEntry.apnName || latestEntry.apnValue} (APN: ${latestEntry.apnValue})`]
        : []),
      `• Waktu: ${new Date(latestEntry.timestamp).toLocaleString('id-ID')}`,
      `• Diukur di: https://juruspeedtest.online`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const complaintText = complaintEntry
    ? generateIspComplaintText(complaintEntry, maskIp)
    : '';

  const handleCopyComplaint = async () => {
    if (!complaintText) return;
    try {
      await navigator.clipboard.writeText(complaintText);
      setCopiedComplaint(true);
      setTimeout(() => setCopiedComplaint(false), 2200);
    } catch {
      // ignore
    }
  };

  const avgDownload =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.downloadMbps, 0) / history.length
      : 0;
  const avgUpload =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.uploadMbps, 0) / history.length
      : 0;

  return (
    <section className="mt-6 space-y-6">
      {/* Export / Share Banner when a test just completed */}
      {latestEntry && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              Bagikan Bukti Pengujian atau Buat Laporan Komplain Teknis ISP
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              Unduh sertifikat PNG beresolusi tinggi atau buat naskah komplain standar NOC untuk CS Operator / IndiHome / Biznet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadResultCardPng(latestEntry, maskIp)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Kartu PNG</span>
            </button>
            <button
              type="button"
              onClick={() => setComplaintEntry(latestEntry)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-300"
            >
              <FileWarning className="h-4 w-4" />
              <span>Laporan Komplain CS ISP</span>
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-teal-500/40 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-teal-300"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Local History */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 dark:border-slate-800/90 dark:bg-[#0C1221]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-teal-500" />
            <div>
              <h2 className="font-display text-sm font-extrabold tracking-wide text-slate-900 uppercase dark:text-white">
                Riwayat Pengujian Lokal
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tersimpan otomatis di perangkat Anda ({history.length} pengujian)
                {history.length > 1 &&
                  ` • Rata-rata Unduh ${formatSpeed(avgDownload, unit)} ${unit} / Unggah ${formatSpeed(
                    avgUpload,
                    unit
                  )} ${unit}`}
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Belum ada riwayat pengujian. Tekan tombol <strong>Mulai Uji Sekarang</strong> untuk merekam hasil pertama Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                  <th className="pb-2.5 pr-3">Waktu &amp; Tahap</th>
                  <th className="pb-2.5 px-3">APN &amp; Operator</th>
                  <th className="pb-2.5 px-3 text-right">Download &amp; Data</th>
                  <th className="pb-2.5 px-3 text-right">Upload &amp; Data</th>
                  <th className="pb-2.5 px-3 text-right">Ping / Jitter / Loss</th>
                  <th className="pb-2.5 px-3 text-center">Skor &amp; Bloat</th>
                  <th className="pb-2.5 pl-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {history.map(item => {
                  const profileLabel = TEST_PROFILES[item.profileId]?.label || 'Standar';
                  const dlBytes =
                    typeof item.downloadBytesUsed === 'number'
                      ? item.downloadBytesUsed
                      : Math.round(item.totalBytesUsed * 0.62);
                  const ulBytes =
                    typeof item.uploadBytesUsed === 'number'
                      ? item.uploadBytesUsed
                      : Math.max(0, item.totalBytesUsed - dlBytes);

                  return (
                    <tr
                      key={item.id}
                      className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                    >
                      {/* 1. Waktu & Tahap */}
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(item.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {item.stageRole === 'before' && (
                            <span className="rounded bg-slate-200/90 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
                              SEBELUM
                            </span>
                          )}
                          {item.stageRole === 'after_speed' && (
                            <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-teal-700 uppercase dark:text-teal-300">
                              SESUDAH CEPAT
                            </span>
                          )}
                          {item.stageRole === 'after_gaming' && (
                            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-700 uppercase dark:text-violet-300">
                              SESUDAH GAME
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono-tabular text-[10px] text-slate-400">
                          Mode {profileLabel} • Total {formatBytes(item.totalBytesUsed)}
                        </div>
                      </td>

                      {/* 2. APN & Operator */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono-tabular text-[11px] font-extrabold text-teal-700 dark:text-teal-300">
                            APN: {item.apnValue || 'default'}
                          </span>
                          {item.apnProtocol && (
                            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono-tabular text-[9px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {item.apnProtocol}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 max-w-[210px] truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {item.apnName || item.isp}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.isp} • {item.city} (CF {item.coloCode})
                        </div>
                      </td>

                      {/* 3. Download & Data */}
                      <td className="py-3 px-3 text-right font-mono-tabular">
                        <div className="font-extrabold text-teal-600 dark:text-teal-400">
                          {formatSpeed(item.downloadMbps, unit)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Puncak {formatSpeed(item.downloadPeakMbps, unit)} • {formatBytes(dlBytes)}
                        </div>
                      </td>

                      {/* 4. Upload & Data */}
                      <td className="py-3 px-3 text-right font-mono-tabular">
                        <div className="font-extrabold text-sky-600 dark:text-sky-400">
                          {formatSpeed(item.uploadMbps, unit)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Puncak {formatSpeed(item.uploadPeakMbps, unit)} • {formatBytes(ulBytes)}
                        </div>
                      </td>

                      {/* 5. Ping / Jitter / Loss */}
                      <td className="py-3 px-3 text-right font-mono-tabular">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {Math.round(item.pingMs)} ms{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            (±{item.jitterMs.toFixed(1)} ms)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Loss {item.packetLossPct.toFixed(1)}%
                          {item.downloadLoadedMs ? ` • Beban ${Math.round(item.downloadLoadedMs)}ms` : ''}
                        </div>
                      </td>

                      {/* 6. Skor & Bufferbloat */}
                      <td className="py-3 px-3 text-center font-mono-tabular">
                        <div className="inline-flex items-center gap-1">
                          <span className="inline-block rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Grade {item.bufferbloatGrade}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                          Skor {item.overallScore}/100
                          {typeof item.gamingScore === 'number' ? ` • Game ${item.gamingScore}` : ''}
                        </div>
                      </td>

                      {/* 7. Aksi */}
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setComplaintEntry(item)}
                            title="Buat Laporan Komplain Teknis ISP"
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-500/10 hover:text-amber-500"
                          >
                            <FileWarning className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadResultCardPng(item, maskIp)}
                            title="Unduh Kartu PNG"
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-teal-500/10 hover:text-teal-500"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(item.id)}
                            title="Hapus Baris"
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Generator Bukti Komplain Teknis ISP (NOC Standard) */}
      {complaintEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0E1526]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-extrabold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                  Generator Laporan Gangguan Berstandar NOC
                </span>
                <h3 className="mt-0.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  Bukti Komplain Teknis untuk CS {complaintEntry.isp}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComplaintEntry(null)}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Salin atau teruskan laporan telemetri resmi ini ke WhatsApp CS / Teknisi lapangan ISP Anda disertai lampiran <strong>Kartu PNG</strong> agar penanganan gangguan langsung dieskalasi ke tim jaringan:
            </p>

            <pre className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono-tabular text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
              {complaintText}
            </pre>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(complaintText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim Laporan via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyComplaint}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-teal-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {copiedComplaint ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>Naskah Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin Naskah Komplain</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => downloadResultCardPng(complaintEntry, maskIp)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-teal-500/35 bg-teal-500/10 px-3.5 py-2.5 text-xs font-bold text-teal-700 dark:text-teal-300"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Bukti PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
