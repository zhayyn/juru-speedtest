import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from './app.js';
import { createMidtransClient } from './midtrans.js';
import { createFirestoreStore } from './store.js';
import { loadVouchers } from './plans.js';

const env = process.env;

initializeApp({
  credential: applicationDefault(),
  projectId: env.GOOGLE_CLOUD_PROJECT || 'juruhukum-id',
});

const midtrans = env.MIDTRANS_SERVER_KEY
  ? createMidtransClient({
      serverKey: env.MIDTRANS_SERVER_KEY.trim(),
      isProduction: env.MIDTRANS_IS_PRODUCTION === 'true',
    })
  : null;

if (!midtrans) {
  console.warn('MIDTRANS_SERVER_KEY kosong: checkout online nonaktif (voucher tetap berfungsi).');
}

const vouchers = loadVouchers(env);
const allowedOrigins = (
  env.ALLOWED_ORIGINS ||
  'https://juruspeedtest.online,https://www.juruspeedtest.online,https://localhost,capacitor://localhost,http://localhost'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const app = createApp({
  auth: getAuth(),
  store: createFirestoreStore(getFirestore()),
  midtrans,
  vouchers,
  allowedOrigins,
  appUrl: env.APP_URL || 'https://juruspeedtest.online/',
});

const port = Number(env.PORT) || 8080;
app.listen(port, () => {
  console.log(
    `Juru Speedtest API siap di :${port} | midtrans=${
      midtrans ? (midtrans.isProduction ? 'PRODUCTION' : 'sandbox') : 'off'
    } | voucher=${vouchers.size}`
  );
});

