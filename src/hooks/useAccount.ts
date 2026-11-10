import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, firestoreDb } from '../config/firebase';
import type { SubscriptionPlan } from '../types/speedtest';
import { syncOrder } from '../utils/payment-api';
import { resolveEffectivePlan } from '../utils/plan';

export interface AccountState {
  user: User | null;
  loading: boolean;
  plan: SubscriptionPlan;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
  paymentNotice: string | null;
  clearPaymentNotice: () => void;
}

export function useAccount(): AccountState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDoc, setPlanDoc] = useState<Record<string, unknown> | undefined>();
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, u => {
        setUser(u);
        setLoading(false);
        if (!u) setPlanDoc(undefined);
      }),
    []
  );

  // Langganan real-time ke dokumen lisensi pengguna (hanya baca di klien; ditulis server)
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(firestoreDb, 'users', user.uid),
      snap => setPlanDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined),
      () => setPlanDoc(undefined)
    );
  }, [user]);

  // Sinkronisasi otomatis status pesanan saat pengguna kembali dari halaman pembayaran Midtrans (?order_id=...)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    if (!orderId) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await user.getIdToken();
        const { status } = await syncOrder(token, orderId);
        if (cancelled) return;
        setPaymentNotice(
          status === 'paid'
            ? '✓ Pembayaran Rp 4.999 berhasil! Juru Speedtest Pro sudah terbuka SELAMANYA & bebas iklan.'
            : status === 'pending'
            ? 'Pembayaran Anda sedang menunggu konfirmasi. Akses Selamanya akan aktif otomatis begitu pembayaran diterima.'
            : 'Transaksi pembayaran belum selesai. Silakan coba kembali bila diperlukan.'
        );
      } catch {
        if (!cancelled) {
          setPaymentNotice(
            'Status pembayaran belum dapat diperiksa saat ini. Muat ulang halaman sebentar lagi.'
          );
        }
      } finally {
        if (!cancelled) {
          ['order_id', 'status_code', 'transaction_status'].forEach(k => params.delete(k));
          const qs = params.toString();
          window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const plan = useMemo(() => (user ? resolveEffectivePlan(planDoc) : 'free'), [user, planDoc]);

  const signIn = useCallback(async () => {
    await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(() => firebaseSignOut(firebaseAuth), []);

  const getIdToken = useCallback(async () => {
    if (!firebaseAuth.currentUser) throw new Error('Belum masuk ke akun Google');
    return firebaseAuth.currentUser.getIdToken();
  }, []);

  const clearPaymentNotice = useCallback(() => setPaymentNotice(null), []);

  return {
    user,
    loading,
    plan,
    signIn,
    signOut,
    getIdToken,
    paymentNotice,
    clearPaymentNotice,
  };
}

