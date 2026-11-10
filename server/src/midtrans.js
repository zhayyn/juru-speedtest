import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Klien Midtrans minimal (Snap + Status API) tanpa dependensi tambahan.
 */
export function createMidtransClient({ serverKey, isProduction = false, fetchImpl = fetch }) {
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY belum diatur');

  const snapBase = isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
  const apiBase = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  const auth = 'Basic ' + Buffer.from(`${serverKey}:`).toString('base64');

  async function request(url, init = {}) {
    const res = await fetchImpl(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: auth,
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(`Midtrans ${res.status}`);
      err.status = res.status;
      err.details = data;
      throw err;
    }
    return data;
  }

  return {
    isProduction,

    /** Membuat transaksi Snap → { token, redirect_url } */
    createSnapTransaction(payload) {
      return request(`${snapBase}/snap/v1/transactions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /** Status transaksi resmi dari Midtrans (sumber kebenaran). */
    getStatus(orderId) {
      return request(`${apiBase}/v2/${encodeURIComponent(orderId)}/status`);
    },

    /** Verifikasi signature_key notifikasi: sha512(order_id + status_code + gross_amount + serverKey) */
    verifySignature(n) {
      if (!n || typeof n.signature_key !== 'string') return false;
      const expected = createHash('sha512')
        .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey}`)
        .digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(n.signature_key);
      return a.length === b.length && timingSafeEqual(a, b);
    },
  };
}

/**
 * Menerjemahkan status Midtrans menjadi status internal.
 * 'paid' hanya untuk settlement, atau capture dengan fraud_status accept.
 */
export function classifyTransaction(status) {
  const ts = status?.transaction_status;
  const fraud = status?.fraud_status;
  if (ts === 'settlement') return 'paid';
  if (ts === 'capture') return fraud === 'accept' || !fraud ? 'paid' : 'pending';
  if (ts === 'pending' || ts === 'authorize') return 'pending';
  if (['deny', 'cancel', 'expire', 'failure'].includes(ts)) return 'failed';
  if (['refund', 'partial_refund', 'chargeback', 'partial_chargeback'].includes(ts)) return 'reversed';
  return 'pending';
}

