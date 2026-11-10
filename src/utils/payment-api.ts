import { API_BASE_URL } from '../config/firebase';
import type { SubscriptionPlan } from '../types/speedtest';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function post<T>(path: string, idToken: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Tidak dapat terhubung ke server pembayaran. Periksa koneksi internet Anda atau gunakan bantuan WhatsApp.',
      0
    );
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new ApiError(data.error || 'Terjadi kesalahan. Silakan coba lagi.', res.status);
  }
  return data;
}

export function redeemVoucher(idToken: string, code: string) {
  return post<{
    ok: true;
    grantedPlan: SubscriptionPlan;
    plan: SubscriptionPlan;
  }>('/api/redeem-voucher', idToken, { code });
}

export function createCheckout(idToken: string, plan: 'lifetime_pro' = 'lifetime_pro') {
  return post<{ orderId: string; token: string; redirectUrl: string }>(
    '/api/checkout',
    idToken,
    { plan }
  );
}

export function syncOrder(idToken: string, orderId: string) {
  return post<{ status: 'paid' | 'pending' | 'failed' | 'reversed' | 'unknown' }>(
    '/api/sync-order',
    idToken,
    { orderId }
  );
}

