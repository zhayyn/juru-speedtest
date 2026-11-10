import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

/**
 * Konfigurasi Firebase Web. Nilai ini dirancang publik untuk klien web;
 * keamanan data dijaga oleh Firestore Security Rules (firestore.rules)
 * dan verifikasi Firebase ID Token di server pembayaran (server/).
 */
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBDNXvx2shFW24oWuV83YeYXO5THK2l4sQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'juruhukum-id.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'juruhukum-id',
  appId: env.VITE_FIREBASE_APP_ID || '1:212855420460:web:91e5cc01e211dab5ad0389',
  messagingSenderId: env.VITE_FIREBASE_SENDER_ID || '212855420460',
};

/** URL API pembayaran Midtrans & voucher (Cloud Run). */
export const API_BASE_URL = (
  env.VITE_API_BASE_URL || 'https://juruspeedtest-api-212855420460.asia-southeast2.run.app'
).replace(/\/$/, '');

const app = getApps()[0] || initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firestoreDb = getFirestore(app);

