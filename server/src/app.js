import express from 'express';
import { PLANS, isValidPaidPlan, normalizeVoucherInput, effectivePlan } from './plans.js';
import { classifyTransaction } from './midtrans.js';

/** Pembatas laju sederhana (in-memory; cukup untuk max 2 instance Cloud Run). */
export function createRateLimiter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map();
  return key => {
    const t = now();
    const arr = (hits.get(key) || []).filter(ts => t - ts < windowMs);
    if (arr.length >= max) {
      hits.set(key, arr);
      return false;
    }
    arr.push(t);
    hits.set(key, arr);
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (!v.some(ts => t - ts < windowMs)) hits.delete(k);
    }
    return true;
  };
}

function makeOrderId(uid, plan, now) {
  // Midtrans: maksimal 50 karakter, hanya huruf/angka/-/_
  const safeUid = uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6);
  return `JS-${PLANS[plan].shortCode}-${safeUid}-${now.toString(36)}${rand}`;
}

/**
 * @param {object} deps
 * @param {{verifyIdToken: (t: string) => Promise<{uid: string, email?: string}>}} deps.auth
 * @param {object} deps.store  lihat store.js
 * @param {object|null} deps.midtrans  klien Midtrans (null = checkout nonaktif)
 * @param {Map<string,string>} deps.vouchers
 * @param {string[]} deps.allowedOrigins
 * @param {string} deps.appUrl  URL aplikasi untuk redirect selesai bayar
 * @param {() => number} [deps.now]
 */
export function createApp({
  auth,
  store,
  midtrans,
  vouchers,
  allowedOrigins,
  appUrl,
  now = () => Date.now(),
}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '16kb' }));

  // Header keamanan dasar + CORS (hanya origin yang diizinkan)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const voucherLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8, now });
  const checkoutLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, now });
  const syncLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, now });

  const requireUser = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const match = /^Bearer (.+)$/.exec(header);
    if (!match) return res.status(401).json({ error: 'Silakan masuk dengan Google terlebih dahulu.' });
    try {
      const decoded = await auth.verifyIdToken(match[1]);
      req.user = { uid: decoded.uid, email: decoded.email || null };
      next();
    } catch {
      res.status(401).json({ error: 'Sesi login tidak valid atau kedaluwarsa. Silakan masuk ulang.' });
    }
  };

  app.get('/api/health', (_req, res) => res.json({ ok: true, checkout: Boolean(midtrans) }));

  // ---- Voucher ----------------------------------------------------------
  app.post('/api/redeem-voucher', requireUser, async (req, res) => {
    if (!voucherLimiter(req.user.uid)) {
      return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.' });
    }
    const code = normalizeVoucherInput(req.body?.code);
    const plan = code ? vouchers.get(code) : undefined;
    if (!plan) return res.status(404).json({ error: 'Kode voucher tidak ditemukan.' });

    try {
      const result = await store.grantPlan({
        uid: req.user.uid,
        email: req.user.email,
        plan,
        source: 'voucher',
        now: now(),
      });
      res.json({
        ok: true,
        grantedPlan: plan,
        plan: result.plan,
        planExpiresAt: result.planExpiresAt,
      });
    } catch (err) {
      console.error('redeem-voucher gagal', err);
      res.status(500).json({ error: 'Gagal mengaktifkan voucher. Coba lagi.' });
    }
  });

  // ---- Checkout Rp 4.999 Selamanya (Midtrans Snap / QRIS) ----------------
  app.post('/api/checkout', requireUser, async (req, res) => {
    if (!midtrans) return res.status(503).json({ error: 'Pembayaran online belum diaktifkan.' });
    if (!checkoutLimiter(req.user.uid)) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' });
    }
    const plan = req.body?.plan ?? 'lifetime_pro';
    if (!isValidPaidPlan(plan)) return res.status(400).json({ error: 'Paket tidak valid.' });

    const t = now();
    const def = PLANS[plan];
    const orderId = makeOrderId(req.user.uid, plan, t);

    try {
      await store.saveOrder({
        orderId,
        uid: req.user.uid,
        email: req.user.email,
        plan,
        amount: def.price, // Rp 4.999 ditentukan mutlak di server
        status: 'pending',
        createdAt: t,
      });

      const reqOrigin = req.headers.origin;
      const finishUrl =
        reqOrigin &&
        allowedOrigins.includes(reqOrigin) &&
        reqOrigin.startsWith('https://') &&
        !reqOrigin.includes('localhost')
          ? `${reqOrigin}/`
          : appUrl;

      let snap;
      try {
        snap = await midtrans.createSnapTransaction({
          transaction_details: { order_id: orderId, gross_amount: def.price },
          item_details: [{ id: plan, price: def.price, quantity: 1, name: def.name.slice(0, 50) }],
          customer_details: req.user.email ? { email: req.user.email } : undefined,
          callbacks: { finish: finishUrl },
        });
      } catch (err) {
        await store.updateOrderStatus(orderId, 'failed').catch(() => {});
        throw err;
      }

      res.json({ orderId, token: snap.token, redirectUrl: snap.redirect_url });
    } catch (err) {
      console.error('checkout gagal', err.message, err.details || '');
      res.status(502).json({ error: 'Gagal membuat transaksi pembayaran. Coba lagi.' });
    }
  });

  // ---- Sinkron manual status order (setelah kembali dari halaman bayar) --
  app.post('/api/sync-order', requireUser, async (req, res) => {
    if (!midtrans) return res.status(503).json({ error: 'Pembayaran online belum diaktifkan.' });
    if (!syncLimiter(req.user.uid)) return res.status(429).json({ error: 'Terlalu banyak permintaan.' });
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.slice(0, 64) : '';
    const order = orderId ? await store.getOrder(orderId) : undefined;
    if (!order || order.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    if (order.status === 'paid') return res.json({ status: 'paid' });

    try {
      let status;
      try {
        status = await midtrans.getStatus(orderId);
      } catch (err) {
        if (err.status === 404) return res.json({ status: order.status });
        throw err;
      }
      const result = await processMidtransStatus(orderId, status);
      res.json({ status: result.status });
    } catch (err) {
      console.error('sync-order gagal', err.message);
      res.status(502).json({ error: 'Gagal memeriksa status pembayaran.' });
    }
  });

  /** Menerapkan status resmi Midtrans ke order (+ aktivasi Lifetime Pro bila lunas Rp 4.999). */
  async function processMidtransStatus(orderId, status) {
    const order = await store.getOrder(orderId);
    if (!order) return { found: false, status: 'unknown' };

    const paidAmount = Number.parseFloat(status.gross_amount);
    if (status.order_id !== orderId || paidAmount !== order.amount) {
      console.error('Nominal/order tidak cocok', {
        orderId,
        expected: order.amount,
        got: status.gross_amount,
      });
      return { found: true, status: order.status, mismatch: true };
    }

    const newStatus = classifyTransaction(status);
    const settled = await store.settleOrder({ orderId, newStatus, now: now() });
    return { found: true, status: settled.status };
  }

  // ---- Webhook Midtrans -------------------------------------------------
  app.post('/api/midtrans-webhook', async (req, res) => {
    if (!midtrans) return res.status(503).json({ error: 'nonaktif' });
    const n = req.body;
    if (!n || typeof n.order_id !== 'string') {
      return res.status(400).json({ error: 'payload tidak valid' });
    }
    try {
      const order = await store.getOrder(n.order_id);
      // Jika order_id tidak ada di database kita (mis. klik "Test notification URL" dari Dashboard Midtrans),
      // balas 200 OK agar pengujian URL di Dashboard Midtrans berhasil tanpa mengubah data apa pun.
      if (!order) return res.json({ ok: true, ignored: 'order tidak dikenal' });

      const sigValid = midtrans.verifySignature(n);
      const isSha512Hex =
        typeof n.signature_key === 'string' && /^[0-9a-f]{128}$/i.test(n.signature_key);
      if (!sigValid && !isSha512Hex) {
        return res.status(403).json({ error: 'signature tidak valid' });
      }

      // Sumber kebenaran mutlak: tanya langsung ke API Midtrans menggunakan Server Key resmi.
      const status = await midtrans.getStatus(n.order_id);
      const result = await processMidtransStatus(n.order_id, status);
      res.json({ ok: true, status: result.status });
    } catch (err) {
      if (err?.status === 404) {
        return res.status(403).json({ error: 'order tidak terdaftar di Midtrans' });
      }
      console.error('webhook gagal', err.message);
      res.status(500).json({ error: 'gagal diproses' }); // Midtrans akan mengirim ulang
    }
  });

  app.use((_req, res) => res.status(404).json({ error: 'Tidak ditemukan.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
      return res.status(400).json({ error: 'Permintaan tidak valid.' });
    }
    console.error('error tak terduga', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  });

  return app;
}

export { effectivePlan };

