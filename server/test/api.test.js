import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from '../src/app.js';
import { createMemoryStore } from '../src/store.js';
import { createMidtransClient } from '../src/midtrans.js';
import { loadVouchers } from '../src/plans.js';

const SERVER_KEY = 'SB-Mid-server-SPEEDTESTKEY';

function sign(n) {
  return createHash('sha512')
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${SERVER_KEY}`)
    .digest('hex');
}

/** Midtrans palsu untuk pengujian Snap & Status API */
function fakeMidtransFetch(state) {
  return async (url, init = {}) => {
    const reply = (status, body) => ({
      ok: status < 400,
      status,
      text: async () => JSON.stringify(body),
    });
    if (url.endsWith('/snap/v1/transactions')) {
      const body = JSON.parse(init.body);
      state.created.push(body);
      return reply(201, { token: 'snap-token-4999', redirect_url: 'https://pay.example/qris-4999' });
    }
    const m = /\/v2\/(.+)\/status$/.exec(url);
    if (m) {
      const orderId = decodeURIComponent(m[1]);
      const s = state.statuses[orderId];
      if (!s) return reply(404, { status_code: '404' });
      return reply(200, { order_id: orderId, ...s });
    }
    return reply(500, {});
  };
}

async function setup({ withMidtrans = true, now = () => 1_700_000_000_000 } = {}) {
  const state = { created: [], statuses: {} };
  const store = createMemoryStore();
  const midtrans = withMidtrans
    ? createMidtransClient({ serverKey: SERVER_KEY, fetchImpl: fakeMidtransFetch(state) })
    : null;
  const app = createApp({
    auth: {
      async verifyIdToken(t) {
        if (!t.startsWith('uid:')) throw new Error('bad token');
        return { uid: t.slice(4), email: `${t.slice(4)}@example.com` };
      },
    },
    store,
    midtrans,
    vouchers: loadVouchers({ VOUCHER_LIFETIME_PRO: 'juruspeed, GAMER4999' }),
    allowedOrigins: ['https://juruspeedtest.online'],
    appUrl: 'https://juruspeedtest.online/',
    now,
  });

  const server = await new Promise(r => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { token, body, method = 'POST', headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
  };

  return { call, store, state, close: () => server.close() };
}

test('voucher: wajib login Google terlebih dahulu', async () => {
  const t = await setup();
  const r = await t.call('/api/redeem-voucher', { body: { code: 'JURUSPEED' } });
  assert.equal(r.status, 401);
  t.close();
});

test('voucher: kode valid mengaktifkan lifetime_pro tanpa menimpa field aplikasi lain', async () => {
  const t = await setup();
  // Simulasikan user yang sudah punya dokumen dari JuruHukum
  t.store.users.set('alice', { plan: 'single_case', planExpiresAt: null });

  const r = await t.call('/api/redeem-voucher', {
    token: 'uid:alice',
    body: { code: '  juruspeed ' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.plan, 'lifetime_pro');
  assert.equal(r.json.planExpiresAt, null);
  assert.equal(t.store.users.get('alice').speedtestPlan, 'lifetime_pro');
  assert.equal(t.store.users.get('alice').plan, 'single_case'); // tetap utuh
  t.close();
});

test('voucher: kode tidak dikenal ditolak & dibatasi laju (anti brute-force)', async () => {
  const t = await setup();
  const bad = await t.call('/api/redeem-voucher', { token: 'uid:bob', body: { code: 'SALAH' } });
  assert.equal(bad.status, 404);
  assert.equal(t.store.users.has('bob'), false);

  let last;
  for (let i = 0; i < 8; i++) {
    last = await t.call('/api/redeem-voucher', { token: 'uid:bob', body: { code: 'TEBAK' + i } });
  }
  assert.equal(last.status, 429);
  t.close();
});

test('checkout: nominal Rp 4.999 ditentukan server (mengabaikan manipulasi nominal dari klien)', async () => {
  const t = await setup();
  const r = await t.call('/api/checkout', {
    token: 'uid:dina',
    body: { plan: 'lifetime_pro', amount: 1 },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.redirectUrl, 'https://pay.example/qris-4999');
  assert.equal(t.state.created[0].transaction_details.gross_amount, 4999);
  assert.ok(r.json.orderId.startsWith('JS-LP-'));
  assert.ok(r.json.orderId.length <= 50);

  const order = await t.store.getOrder(r.json.orderId);
  assert.equal(order.uid, 'dina');
  assert.equal(order.amount, 4999);
  assert.equal(order.status, 'pending');
  t.close();
});

test('checkout: paket tidak valid = 400; tanpa kunci Midtrans = 503', async () => {
  const t = await setup();
  assert.equal(
    (await t.call('/api/checkout', { token: 'uid:dina', body: { plan: 'paket_palsu' } })).status,
    400
  );
  t.close();

  const off = await setup({ withMidtrans: false });
  assert.equal(
    (await off.call('/api/checkout', { token: 'uid:dina', body: { plan: 'lifetime_pro' } })).status,
    503
  );
  off.close();
});

async function makeOrder(t, uid) {
  const r = await t.call('/api/checkout', {
    token: `uid:${uid}`,
    body: { plan: 'lifetime_pro' },
  });
  return r.json.orderId;
}

test('webhook: signature SHA-512 palsu ditolak dengan 403', async () => {
  const t = await setup();
  const orderId = await makeOrder(t, 'eka');
  const r = await t.call('/api/midtrans-webhook', {
    body: { order_id: orderId, status_code: '200', gross_amount: '4999.00', signature_key: 'palsu' },
  });
  assert.equal(r.status, 403);
  assert.equal(t.store.users.has('eka'), false);
  t.close();
});

test('webhook: settlement Rp 4.999 membuka lifetime_pro selamanya & idempoten', async () => {
  const t = await setup();
  const orderId = await makeOrder(t, 'fani');
  t.state.statuses[orderId] = {
    transaction_status: 'settlement',
    gross_amount: '4999.00',
    status_code: '200',
  };
  const n = { order_id: orderId, status_code: '200', gross_amount: '4999.00' };
  n.signature_key = sign(n);

  const first = await t.call('/api/midtrans-webhook', { body: n });
  assert.equal(first.status, 200);
  assert.equal(t.store.users.get('fani').speedtestPlan, 'lifetime_pro');
  assert.equal(t.store.users.get('fani').speedtestPlanExpiresAt, null);

  const second = await t.call('/api/midtrans-webhook', { body: n });
  assert.equal(second.status, 200);
  assert.equal(t.store.users.get('fani').speedtestPlan, 'lifetime_pro');
  t.close();
});

test('webhook: nominal bayar kurang dari Rp 4.999 ditolak & tidak membuka akses', async () => {
  const t = await setup();
  const orderId = await makeOrder(t, 'gita');
  t.state.statuses[orderId] = {
    transaction_status: 'settlement',
    gross_amount: '1000.00',
    status_code: '200',
  };
  const n = { order_id: orderId, status_code: '200', gross_amount: '1000.00' };
  n.signature_key = sign(n);

  await t.call('/api/midtrans-webhook', { body: n });
  assert.equal(t.store.users.has('gita'), false);
  t.close();
});

test('sync-order: pemilik pesanan dapat menyinkronkan status lunas; pengguna lain ditolak', async () => {
  const t = await setup();
  const orderId = await makeOrder(t, 'indra');
  t.state.statuses[orderId] = {
    transaction_status: 'settlement',
    gross_amount: '4999.00',
    status_code: '200',
  };

  assert.equal(
    (await t.call('/api/sync-order', { token: 'uid:orang_lain', body: { orderId } })).status,
    404
  );

  const ok = await t.call('/api/sync-order', { token: 'uid:indra', body: { orderId } });
  assert.equal(ok.json.status, 'paid');
  assert.equal(t.store.users.get('indra').speedtestPlan, 'lifetime_pro');
  t.close();
});

test('CORS: hanya mengizinkan origin resmi Juru Speedtest', async () => {
  const t = await setup();
  const good = await t.call('/api/health', {
    method: 'GET',
    headers: { Origin: 'https://juruspeedtest.online' },
  });
  assert.equal(good.headers.get('access-control-allow-origin'), 'https://juruspeedtest.online');

  const bad = await t.call('/api/health', {
    method: 'GET',
    headers: { Origin: 'https://phishing.example' },
  });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  t.close();
});

