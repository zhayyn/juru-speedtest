/**
 * Logika paket langganan Juru Speedtest (murni, tanpa I/O supaya mudah diuji).
 *
 * Model produk:
 * - Coba gratis 3x di sisi klien (Sebelum + Sesudah Cepat + Sesudah Stabil Game).
 * - Sekali bayar Rp 4.999 (4999 IDR) untuk membuka Juru Speedtest Pro SELAMANYA (lifetime_pro) + bebas iklan.
 *
 * Harga SELALU ditentukan di server. Nominal yang dikirim browser tidak pernah dipercaya.
 */

export const PLANS = {
  lifetime_pro: {
    id: 'lifetime_pro',
    rank: 1,
    price: 4999,
    name: 'Juru Speedtest Pro Selamanya (Lifetime)',
    shortCode: 'LP',
    durationDays: null, // Sekali bayar berlaku selamanya (tidak kedaluwarsa)
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidPaidPlan(plan) {
  return typeof plan === 'string' && Object.hasOwn(PLANS, plan);
}

/**
 * Paket efektif Juru Speedtest saat ini.
 * Membaca field `speedtestPlan` (dengan fallback `plan` bila bernilai 'lifetime_pro').
 * @param {{speedtestPlan?: string, speedtestPlanExpiresAt?: number|null, plan?: string, planExpiresAt?: number|null}|undefined} userDoc
 * @param {number} now epoch ms
 */
export function effectivePlan(userDoc, now) {
  if (!userDoc) return 'free';
  const rawPlan = isValidPaidPlan(userDoc.speedtestPlan)
    ? userDoc.speedtestPlan
    : isValidPaidPlan(userDoc.plan)
    ? userDoc.plan
    : null;

  if (!rawPlan) return 'free';

  const exp =
    userDoc.speedtestPlan === rawPlan
      ? userDoc.speedtestPlanExpiresAt
      : userDoc.planExpiresAt;

  if (typeof exp === 'number' && exp <= now) return 'free';
  return rawPlan;
}

/**
 * Menghitung paket baru setelah pembayaran Rp 4.999 / aktivasi voucher.
 * - Tidak pernah menurunkan paket yang sudah aktif.
 * - Paket `lifetime_pro` memiliki `planExpiresAt: null` (berlaku selamanya).
 * @returns {{plan: string, planExpiresAt: number|null, changed: boolean}}
 */
export function applyPlanGrant(userDoc, grantedPlan, now) {
  const granted = PLANS[grantedPlan];
  if (!granted) throw new Error(`Paket tidak dikenal: ${grantedPlan}`);

  const current = effectivePlan(userDoc, now);
  const currentRank = current === 'free' ? 0 : PLANS[current].rank;

  if (granted.rank < currentRank) {
    return {
      plan: current,
      planExpiresAt: userDoc?.speedtestPlanExpiresAt ?? null,
      changed: false,
    };
  }

  if (granted.durationDays === null) {
    return {
      plan: granted.id,
      planExpiresAt: null,
      changed: current !== granted.id,
    };
  }

  const base =
    current === granted.id && typeof userDoc?.speedtestPlanExpiresAt === 'number'
      ? Math.max(now, userDoc.speedtestPlanExpiresAt)
      : now;

  return {
    plan: granted.id,
    planExpiresAt: base + granted.durationDays * DAY_MS,
    changed: true,
  };
}

/**
 * Memuat daftar voucher dari environment (disimpan di server, tidak pernah dikirim ke browser).
 * Format: "KODE1,KODE2" pada VOUCHER_LIFETIME_PRO.
 * @param {Record<string, string|undefined>} env
 * @returns {Map<string, string>} kode (UPPERCASE) → id paket
 */
export function loadVouchers(env) {
  const map = new Map();
  const add = (csv, plan) => {
    for (const raw of (csv || '').split(',')) {
      const code = raw.trim().toUpperCase();
      if (code) map.set(code, plan);
    }
  };
  add(env.VOUCHER_LIFETIME_PRO, 'lifetime_pro');
  return map;
}

export function normalizeVoucherInput(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().slice(0, 64);
}

