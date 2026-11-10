import type {
  LatencyMetrics,
  NetworkMeta,
  SpeedSample,
  SpeedtestLiveState,
  TestProfile,
} from '../types/speedtest';
import {
  ASN_ISP_MAP,
  INDONESIAN_CELLULAR_ASNS,
  resolveColoCity,
} from '../utils/networkDiagnostics';

const CF_DOWN_URL = 'https://speed.cloudflare.com/__down';
const CF_UP_URL = 'https://speed.cloudflare.com/__up';

interface ByteEvent {
  time: number;
  bytes: number;
}

/**
 * Extracts Cloudflare worker processing duration (ms) from Server-Timing header
 * so pure network RTT can be isolated accurately.
 */
function parseServerProcessingMs(serverTimingHeader: string | null): number {
  if (!serverTimingHeader) return 0;
  const match = /cfSpeedWorker;dur=([\d.]+)/i.exec(serverTimingHeader);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    return Number.isFinite(val) && val >= 0 ? val : 0;
  }
  return 0;
}

function detectBrowserConnectionInfo(): {
  connectionType?: string;
  connectionCategory: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveRadio?: string;
  downlinkHintMbps?: number;
  rttHintMs?: number;
  saveData?: boolean;
} {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      type?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  };
  if (!nav.connection) {
    return { connectionCategory: 'unknown' };
  }
  const t = (nav.connection.type || '').toLowerCase();
  const eff = (nav.connection.effectiveType || '').toUpperCase();
  let connectionCategory: 'cellular' | 'wifi' | 'ethernet' | 'unknown' = 'unknown';
  if (t === 'cellular') connectionCategory = 'cellular';
  else if (t === 'wifi') connectionCategory = 'wifi';
  else if (t === 'ethernet') connectionCategory = 'ethernet';

  const typeLabel =
    t === 'cellular'
      ? 'SELULER'
      : t === 'wifi'
      ? 'WI-FI'
      : t === 'ethernet'
      ? 'ETHERNET'
      : t && t !== 'unknown'
      ? t.toUpperCase()
      : '';

  const connectionType = typeLabel
    ? eff
      ? `${typeLabel} (${eff})`
      : typeLabel
    : eff || undefined;

  return {
    connectionType,
    connectionCategory,
    effectiveRadio: eff || undefined,
    downlinkHintMbps:
      typeof nav.connection.downlink === 'number' && nav.connection.downlink > 0
        ? nav.connection.downlink
        : undefined,
    rttHintMs:
      typeof nav.connection.rtt === 'number' && nav.connection.rtt > 0
        ? nav.connection.rtt
        : undefined,
    saveData: Boolean(nav.connection.saveData),
  };
}

/**
 * Discovers public IP, ISP, ASN, geolocation, and active Cloudflare Edge PoP (IATA code).
 */
export async function fetchNetworkMetadata(signal?: AbortSignal): Promise<NetworkMeta> {
  const connInfo = detectBrowserConnectionInfo();
  const meta: NetworkMeta = {
    ip: '—',
    isp: 'Jaringan Internet Indonesia',
    asn: '',
    city: 'Indonesia',
    region: '',
    country: 'Indonesia',
    countryCode: 'ID',
    coloCode: 'EDGE',
    coloCity: 'Edge Global',
    connectionType: connInfo.connectionType,
    connectionCategory: connInfo.connectionCategory,
    effectiveRadio: connInfo.effectiveRadio,
    downlinkHintMbps: connInfo.downlinkHintMbps,
    rttHintMs: connInfo.rttHintMs,
    saveData: connInfo.saveData,
    ipVersion: 'IPv4',
    isCellularIsp: connInfo.connectionCategory === 'cellular',
  };

  // Run Cloudflare warm-up probes (__down exposes cf-meta-ip, __up exposes cf-meta-colo) + ipwho.is in parallel
  const cfDownPromise = fetch(`${CF_DOWN_URL}?bytes=0&w=${Date.now()}`, {
    cache: 'no-store',
    signal,
  })
    .then(res => {
      const cfIp = res.headers.get('cf-meta-ip');
      const cfAsn = res.headers.get('cf-meta-asn');
      const cfCity = res.headers.get('cf-meta-city');
      const cfCountry = res.headers.get('cf-meta-country');
      const cfColo = res.headers.get('cf-meta-colo');
      if (cfIp) {
        meta.ip = cfIp;
        meta.ipVersion = cfIp.includes(':') ? 'IPv6' : 'IPv4';
      }
      if (cfAsn) {
        meta.asn = `AS${cfAsn}`;
        if (ASN_ISP_MAP[cfAsn]) meta.isp = ASN_ISP_MAP[cfAsn];
      }
      if (cfCity) meta.city = cfCity;
      if (cfCountry) meta.countryCode = cfCountry;
      if (cfColo) {
        meta.coloCode = cfColo.toUpperCase();
        meta.coloCity = resolveColoCity(cfColo);
      }
    })
    .catch(() => undefined);

  const cfUpWarmupPromise = fetch(`${CF_UP_URL}?w=${Date.now()}`, {
    method: 'POST',
    body: new Uint8Array(0),
    signal,
  })
    .then(res => {
      const cfColo = res.headers.get('cf-meta-colo');
      if (cfColo) {
        meta.coloCode = cfColo.toUpperCase();
        meta.coloCity = resolveColoCity(cfColo);
      }
    })
    .catch(() => undefined);

  const ipWhoController = new AbortController();
  const timeoutId = setTimeout(() => ipWhoController.abort(), 3800);
  if (signal) {
    signal.addEventListener('abort', () => ipWhoController.abort(), { once: true });
  }

  const ipWhoPromise = fetch('https://ipwho.is/', {
    signal: ipWhoController.signal,
  })
    .then(async res => {
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success !== false) {
        if (data.ip) {
          meta.ip = data.ip;
          meta.ipVersion = data.type || (String(data.ip).includes(':') ? 'IPv6' : 'IPv4');
        }
        if (data.city) meta.city = data.city;
        if (data.region) meta.region = data.region;
        if (data.country) meta.country = data.country;
        if (data.country_code) meta.countryCode = data.country_code;
        if (data.connection) {
          const asnNum = data.connection.asn ? String(data.connection.asn) : '';
          if (asnNum) meta.asn = `AS${asnNum}`;
          const rawIsp = data.connection.isp || data.connection.org || '';
          if (asnNum && ASN_ISP_MAP[asnNum]) {
            meta.isp = ASN_ISP_MAP[asnNum];
          } else if (rawIsp) {
            meta.isp = rawIsp;
          }
        }
      }
    })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeoutId));

  await Promise.allSettled([cfDownPromise, cfUpWarmupPromise, ipWhoPromise]);

  const asnClean = (meta.asn || '').replace(/^AS/i, '').trim();
  const ispLow = (meta.isp || '').toLowerCase();
  if (
    INDONESIAN_CELLULAR_ASNS.has(asnClean) ||
    ispLow.includes('telkomsel') ||
    ispLow.includes('indosat') ||
    ispLow.includes('hutchison') ||
    ispLow.includes('axiata') ||
    ispLow.includes('smartfren') ||
    ispLow.includes('by.u') ||
    ispLow.includes('axis')
  ) {
    meta.isCellularIsp = true;
  }
  return meta;
}

/**
 * Single HTTP RTT probe against warm Cloudflare edge connection.
 */
async function probeLatencyOnce(
  timeoutMs: number,
  parentSignal: AbortSignal
): Promise<number | null> {
  if (parentSignal.aborted) return null;

  const probeCtrl = new AbortController();
  const timer = setTimeout(() => probeCtrl.abort(), timeoutMs);
  const onAbort = () => probeCtrl.abort();
  parentSignal.addEventListener('abort', onAbort, { once: true });

  try {
    const t0 = performance.now();
    const res = await fetch(
      `${CF_DOWN_URL}?bytes=0&p=${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      {
        cache: 'no-store',
        signal: probeCtrl.signal,
      }
    );
    await res.arrayBuffer();
    const elapsed = performance.now() - t0;
    if (!res.ok) return null;
    const workerMs = parseServerProcessingMs(res.headers.get('server-timing'));
    return Math.max(1, elapsed - workerMs);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener('abort', onAbort);
  }
}

function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function computeJitter(samples: number[]): number {
  if (samples.length < 2) return 0;
  let diffSum = 0;
  for (let i = 1; i < samples.length; i++) {
    diffSum += Math.abs(samples[i] - samples[i - 1]);
  }
  return diffSum / (samples.length - 1);
}

/**
 * Computes sustained line speed from sliding-window samples (trimmed upper-half mean
 * after TCP slow-start warm-up) so ramp-up doesn't under-report real throughput.
 */
function computeSustainedSpeed(samples: SpeedSample[]): number {
  if (samples.length === 0) return 0;
  const steady = samples.filter(s => s.elapsedMs >= 700 && s.mbps > 0);
  const pool = steady.length >= 4 ? steady : samples.filter(s => s.mbps > 0);
  if (pool.length === 0) return 0;

  const sorted = pool.map(s => s.mbps).sort((a, b) => a - b);
  // Drop top 1 outlier sample if large enough, take upper 55% steady-state mean
  const trimmed = sorted.length >= 8 ? sorted.slice(0, sorted.length - 1) : sorted;
  const startIdx = Math.floor(trimmed.length * 0.42);
  const slice = trimmed.slice(startIdx);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return sum / slice.length;
}

/**
 * Runs a background loaded-latency loop during Download or Upload phase.
 */
async function measureLoadedLatencyLoop(
  durationMs: number,
  signal: AbortSignal,
  onSample: (medianLoadedMs: number) => void
): Promise<number | null> {
  const loadedSamples: number[] = [];
  const start = performance.now();

  // Wait 900ms for throughput streams to saturate the pipe first
  await new Promise(r => setTimeout(r, 900));

  while (!signal.aborted && performance.now() - start < durationMs - 500) {
    const rtt = await probeLatencyOnce(2500, signal);
    if (rtt !== null && !signal.aborted) {
      loadedSamples.push(rtt);
      const sorted = [...loadedSamples].sort((a, b) => a - b);
      onSample(computeMedian(sorted));
    }
    await new Promise(r => setTimeout(r, 650));
  }

  if (loadedSamples.length === 0) return null;
  const sorted = [...loadedSamples].sort((a, b) => a - b);
  return computeMedian(sorted);
}

/**
 * Creates a reusable pseudo-random payload buffer so routers/middleboxes cannot compress it.
 */
function createRandomBuffer(byteLength: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(byteLength));
  // Fill in 64KB blocks using crypto.getRandomValues or fast xorshift
  let seed = 0x9e3779b9;
  for (let i = 0; i < byteLength; i += 4) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    buf[i] = seed & 0xff;
    if (i + 1 < byteLength) buf[i + 1] = (seed >> 8) & 0xff;
    if (i + 2 < byteLength) buf[i + 2] = (seed >> 16) & 0xff;
    if (i + 3 < byteLength) buf[i + 3] = (seed >> 24) & 0xff;
  }
  return buf;
}

export function createInitialLiveState(meta: NetworkMeta | null = null): SpeedtestLiveState {
  return {
    phase: 'idle',
    phaseProgress: 0,
    overallProgress: 0,
    currentGaugeMbps: 0,
    downloadMbps: 0,
    downloadPeakMbps: 0,
    downloadBytes: 0,
    uploadMbps: 0,
    uploadPeakMbps: 0,
    uploadBytes: 0,
    latency: {
      unloadedMs: 0,
      minMs: 0,
      maxMs: 0,
      jitterMs: 0,
      packetLossPct: 0,
      downloadLoadedMs: null,
      uploadLoadedMs: null,
      samples: [],
    },
    downloadSeries: [],
    uploadSeries: [],
    networkMeta: meta,
    errorMessage: null,
  };
}

/**
 * Executes the complete multi-stage Juru Speedtest (Init -> Unloaded Ping -> Download -> Upload).
 */
export async function runFullSpeedtest(options: {
  profile: TestProfile;
  existingMeta: NetworkMeta | null;
  signal: AbortSignal;
  onUpdate: (state: SpeedtestLiveState) => void;
}): Promise<SpeedtestLiveState> {
  const { profile, existingMeta, signal, onUpdate } = options;
  const state: SpeedtestLiveState = createInitialLiveState(existingMeta);

  const emit = () => {
    onUpdate({
      ...state,
      latency: { ...state.latency, samples: [...state.latency.samples] },
      downloadSeries: [...state.downloadSeries],
      uploadSeries: [...state.uploadSeries],
    });
  };

  try {
    // =========================================================================
    // PHASE 0: INIT & EDGE WARM-UP
    // =========================================================================
    state.phase = 'init';
    state.phaseProgress = 25;
    state.overallProgress = 3;
    emit();

    const freshMeta = await fetchNetworkMetadata(signal);
    if (signal.aborted) {
      state.phase = 'aborted';
      emit();
      return state;
    }
    state.networkMeta = freshMeta;
    state.phaseProgress = 100;
    state.overallProgress = 6;
    emit();

    // =========================================================================
    // PHASE 1: UNLOADED PING, JITTER & PACKET LOSS
    // =========================================================================
    state.phase = 'ping';
    state.phaseProgress = 0;
    emit();

    // One warm-up probe so TCP/TLS setup does not skew ping #1
    await probeLatencyOnce(2500, signal);

    const rttSamples: number[] = [];
    let failedProbes = 0;

    for (let i = 0; i < profile.pingSamples; i++) {
      if (signal.aborted) break;
      const rtt = await probeLatencyOnce(2200, signal);
      if (rtt !== null) {
        rttSamples.push(rtt);
      } else if (!signal.aborted) {
        failedProbes++;
      }

      if (rttSamples.length > 0) {
        const sorted = [...rttSamples].sort((a, b) => a - b);
        state.latency.samples = rttSamples;
        state.latency.unloadedMs = computeMedian(sorted);
        state.latency.minMs = sorted[0];
        state.latency.maxMs = sorted[sorted.length - 1];
        state.latency.jitterMs = computeJitter(rttSamples);
      }
      const totalTried = rttSamples.length + failedProbes;
      state.latency.packetLossPct =
        totalTried > 0 ? (failedProbes / totalTried) * 100 : 0;

      state.phaseProgress = Math.round(((i + 1) / profile.pingSamples) * 100);
      state.overallProgress = 6 + Math.round((state.phaseProgress / 100) * 14); // 6% -> 20%
      emit();

      await new Promise(r => setTimeout(r, 45));
    }

    if (signal.aborted) {
      state.phase = 'aborted';
      emit();
      return state;
    }

    if (rttSamples.length === 0) {
      throw new Error(
        'Gagal menghubungi server pengukuran. Periksa koneksi internet atau firewall Anda.'
      );
    }

    // =========================================================================
    // PHASE 2: ADAPTIVE MULTI-STREAM DOWNLOAD + LOADED LATENCY
    // =========================================================================
    state.phase = 'download';
    state.phaseProgress = 0;
    state.currentGaugeMbps = 0;
    emit();

    const dlCtrl = new AbortController();
    const onParentAbortDl = () => dlCtrl.abort();
    signal.addEventListener('abort', onParentAbortDl, { once: true });

    const dlEvents: ByteEvent[] = [];
    const dlStart = performance.now();
    const dlEnd = dlStart + profile.downloadDurationMs;
    let latestInstantDlMbps = 0;
    let smoothedDlMbps = 0;

    const selectDownloadChunkBytes = (streamIdx: number): number => {
      if (latestInstantDlMbps > 150) return 25_000_000;
      if (latestInstantDlMbps > 45) return 10_000_000;
      if (latestInstantDlMbps > 12) return 4_000_000;
      if (latestInstantDlMbps > 0 && latestInstantDlMbps < 3) return 500_000;
      return streamIdx === 0 ? 1_000_000 : 2_000_000;
    };

    const runDownloadWorker = async (streamIdx: number) => {
      while (!dlCtrl.signal.aborted && performance.now() < dlEnd) {
        const chunkBytes = selectDownloadChunkBytes(streamIdx);
        try {
          const res = await fetch(
            `${CF_DOWN_URL}?bytes=${chunkBytes}&s=${streamIdx}&r=${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            {
              cache: 'no-store',
              signal: dlCtrl.signal,
            }
          );
          if (!res.ok || !res.body) break;
          const reader = res.body.getReader();
          while (!dlCtrl.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.byteLength > 0) {
              const now = performance.now();
              dlEvents.push({ time: now, bytes: value.byteLength });
              state.downloadBytes += value.byteLength;
              if (now >= dlEnd) {
                reader.cancel().catch(() => undefined);
                break;
              }
            }
          }
        } catch {
          if (dlCtrl.signal.aborted) break;
          await new Promise(r => setTimeout(r, 80));
        }
      }
    };

    // Sampler interval every 120ms
    const dlSampler = setInterval(() => {
      const now = performance.now();
      const elapsed = now - dlStart;
      const windowMs = Math.min(1400, Math.max(250, elapsed));
      const cutoff = now - windowMs;

      // Prune events older than 2500ms to keep array tiny
      while (dlEvents.length > 0 && dlEvents[0].time < now - 2500) {
        dlEvents.shift();
      }

      let windowBytes = 0;
      for (let i = dlEvents.length - 1; i >= 0; i--) {
        if (dlEvents[i].time >= cutoff) {
          windowBytes += dlEvents[i].bytes;
        } else {
          break;
        }
      }

      const rawMbps = (windowBytes * 8) / ((windowMs / 1000) * 1_000_000);
      latestInstantDlMbps = rawMbps;
      smoothedDlMbps =
        smoothedDlMbps === 0 ? rawMbps : smoothedDlMbps * 0.35 + rawMbps * 0.65;

      state.downloadSeries.push({
        elapsedMs: Math.round(elapsed),
        mbps: Number(smoothedDlMbps.toFixed(2)),
      });

      if (smoothedDlMbps > state.downloadPeakMbps) {
        state.downloadPeakMbps = smoothedDlMbps;
      }

      state.currentGaugeMbps = smoothedDlMbps;
      state.downloadMbps = computeSustainedSpeed(state.downloadSeries);
      state.phaseProgress = Math.min(100, Math.round((elapsed / profile.downloadDurationMs) * 100));
      state.overallProgress = 20 + Math.round((state.phaseProgress / 100) * 40); // 20% -> 60%
      emit();
    }, 120);

    const dlTimeout = setTimeout(() => dlCtrl.abort(), profile.downloadDurationMs);

    const dlLoadedPromise = measureLoadedLatencyLoop(
      profile.downloadDurationMs,
      dlCtrl.signal,
      medianMs => {
        state.latency.downloadLoadedMs = medianMs;
      }
    );

    await Promise.allSettled([
      ...Array.from({ length: profile.parallelStreams }, (_, idx) => runDownloadWorker(idx)),
      dlLoadedPromise,
    ]);

    clearTimeout(dlTimeout);
    clearInterval(dlSampler);
    signal.removeEventListener('abort', onParentAbortDl);

    if (signal.aborted) {
      state.phase = 'aborted';
      state.currentGaugeMbps = 0;
      emit();
      return state;
    }

    state.downloadMbps = Math.max(0.01, computeSustainedSpeed(state.downloadSeries));
    state.downloadPeakMbps = Math.max(state.downloadMbps, state.downloadPeakMbps);
    state.phaseProgress = 100;
    state.overallProgress = 60;
    emit();

    // Brief inter-phase breather so buffers drain before upload measurement
    state.currentGaugeMbps = 0;
    emit();
    await new Promise(r => setTimeout(r, 350));

    // =========================================================================
    // PHASE 3: ADAPTIVE MULTI-STREAM REAL-TIME UPLOAD + LOADED LATENCY
    // =========================================================================
    state.phase = 'upload';
    state.phaseProgress = 0;
    emit();

    const ulCtrl = new AbortController();
    const onParentAbortUl = () => ulCtrl.abort();
    signal.addEventListener('abort', onParentAbortUl, { once: true });

    // Pre-allocate random source buffer (4 MB) and slice views from it
    const masterPayload = createRandomBuffer(4_000_000);
    const payloadCache = new Map<number, Blob>();
    const getUploadBlob = (byteSize: number): Blob => {
      const existing = payloadCache.get(byteSize);
      if (existing) return existing;
      let blob: Blob;
      if (byteSize <= masterPayload.byteLength) {
        blob = new Blob([masterPayload.subarray(0, byteSize)], {
          type: 'application/octet-stream',
        });
      } else {
        const parts: Uint8Array<ArrayBuffer>[] = [];
        let rem = byteSize;
        while (rem > 0) {
          const take = Math.min(rem, masterPayload.byteLength);
          parts.push(masterPayload.subarray(0, take));
          rem -= take;
        }
        blob = new Blob(parts, { type: 'application/octet-stream' });
      }
      payloadCache.set(byteSize, blob);
      return blob;
    };

    const ulEvents: ByteEvent[] = [];
    const ulStart = performance.now();
    const ulEnd = ulStart + profile.uploadDurationMs;
    let latestInstantUlMbps = 0;
    let smoothedUlMbps = 0;

    const selectUploadChunkBytes = (streamIdx: number): number => {
      if (latestInstantUlMbps > 80) return 8_000_000;
      if (latestInstantUlMbps > 25) return 4_000_000;
      if (latestInstantUlMbps > 8) return 1_500_000;
      if (latestInstantUlMbps > 2) return 512_000;
      return streamIdx === 0 ? 256_000 : 384_000;
    };

    const sendUploadChunkXhr = (blob: Blob, abortSig: AbortSignal): Promise<void> =>
      new Promise(resolve => {
        if (abortSig.aborted) {
          resolve();
          return;
        }
        const xhr = new XMLHttpRequest();
        let lastLoaded = 0;

        const abortHandler = () => {
          try {
            xhr.abort();
          } catch {
            // ignore
          }
          resolve();
        };
        abortSig.addEventListener('abort', abortHandler, { once: true });

        xhr.upload.onprogress = ev => {
          const delta = ev.loaded - lastLoaded;
          if (delta > 0) {
            lastLoaded = ev.loaded;
            ulEvents.push({ time: performance.now(), bytes: delta });
            state.uploadBytes += delta;
          }
        };

        const cleanup = () => {
          abortSig.removeEventListener('abort', abortHandler);
          resolve();
        };

        xhr.onload = cleanup;
        xhr.onerror = cleanup;
        xhr.onabort = cleanup;

        xhr.open(
          'POST',
          `${CF_UP_URL}?r=${Math.random().toString(36).slice(2, 8)}`,
          true
        );
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.send(blob);
      });

    const uploadStreams = Math.max(2, Math.min(4, profile.parallelStreams));
    const runUploadWorker = async (streamIdx: number) => {
      while (!ulCtrl.signal.aborted && performance.now() < ulEnd) {
        const size = selectUploadChunkBytes(streamIdx);
        const blob = getUploadBlob(size);
        await sendUploadChunkXhr(blob, ulCtrl.signal);
      }
    };

    const ulSampler = setInterval(() => {
      const now = performance.now();
      const elapsed = now - ulStart;
      const windowMs = Math.min(1500, Math.max(300, elapsed));
      const cutoff = now - windowMs;

      while (ulEvents.length > 0 && ulEvents[0].time < now - 2600) {
        ulEvents.shift();
      }

      let windowBytes = 0;
      for (let i = ulEvents.length - 1; i >= 0; i--) {
        if (ulEvents[i].time >= cutoff) {
          windowBytes += ulEvents[i].bytes;
        } else {
          break;
        }
      }

      const rawMbps = (windowBytes * 8) / ((windowMs / 1000) * 1_000_000);
      latestInstantUlMbps = rawMbps;
      smoothedUlMbps =
        smoothedUlMbps === 0 ? rawMbps : smoothedUlMbps * 0.38 + rawMbps * 0.62;

      state.uploadSeries.push({
        elapsedMs: Math.round(elapsed),
        mbps: Number(smoothedUlMbps.toFixed(2)),
      });

      if (smoothedUlMbps > state.uploadPeakMbps) {
        state.uploadPeakMbps = smoothedUlMbps;
      }

      state.currentGaugeMbps = smoothedUlMbps;
      state.uploadMbps = computeSustainedSpeed(state.uploadSeries);
      state.phaseProgress = Math.min(100, Math.round((elapsed / profile.uploadDurationMs) * 100));
      state.overallProgress = 60 + Math.round((state.phaseProgress / 100) * 40); // 60% -> 100%
      emit();
    }, 120);

    const ulTimeout = setTimeout(() => ulCtrl.abort(), profile.uploadDurationMs);

    const ulLoadedPromise = measureLoadedLatencyLoop(
      profile.uploadDurationMs,
      ulCtrl.signal,
      medianMs => {
        state.latency.uploadLoadedMs = medianMs;
      }
    );

    await Promise.allSettled([
      ...Array.from({ length: uploadStreams }, (_, idx) => runUploadWorker(idx)),
      ulLoadedPromise,
    ]);

    clearTimeout(ulTimeout);
    clearInterval(ulSampler);
    signal.removeEventListener('abort', onParentAbortUl);

    if (signal.aborted) {
      state.phase = 'aborted';
      state.currentGaugeMbps = 0;
      emit();
      return state;
    }

    state.uploadMbps = Math.max(0.01, computeSustainedSpeed(state.uploadSeries));
    state.uploadPeakMbps = Math.max(state.uploadMbps, state.uploadPeakMbps);
    state.currentGaugeMbps = state.downloadMbps;
    state.phase = 'complete';
    state.phaseProgress = 100;
    state.overallProgress = 100;
    emit();

    return state;
  } catch (err) {
    if (signal.aborted) {
      state.phase = 'aborted';
      emit();
      return state;
    }
    state.phase = 'error';
    state.errorMessage =
      err instanceof Error
        ? err.message
        : 'Terjadi gangguan jaringan saat menjalankan pengujian.';
    emit();
    return state;
  }
}

