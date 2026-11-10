import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import type { AccountState } from '../hooks/useAccount';
import type { SpeedtestHistoryEntry, SubscriptionPlan } from '../types/speedtest';
import { buildViralShareWhatsAppUrl } from '../utils/networkDiagnostics';
import { ApiError, createCheckout, redeemVoucher } from '../utils/payment-api';
import type { TrialQuotaStatus } from '../utils/plan';
import type { LegalPageSlug } from './LegalCompliancePages';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  trialStatus: TrialQuotaStatus;
  account: AccountState;
  baselineEntry: SpeedtestHistoryEntry | null;
  afterEntry: SpeedtestHistoryEntry | null;
  onOpenLegalPage?: (page: LegalPageSlug) => void;
  onClaimShareBonus?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  trialStatus,
  account,
  baselineEntry,
  afterEntry,
  onOpenLegalPage,
  onClaimShareBonus,
}) => {
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [checkoutToast, setCheckoutToast] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const priceLabel = MONETIZATION_CONFIG.pricing.lifetimeLabel; // Rp 4.999

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await account.signIn();
    } catch {
      setAuthError('Login Google dibatalkan atau gagal. Silakan coba lagi.');
    }
  };

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    if (!account.user) {
      setVoucherError(
        'Masuk dengan Google terlebih dahulu agar akses Selamanya tersimpan permanen di akun Anda.'
      );
      return;
    }
    if (!voucherInput.trim()) return;
    setIsRedeeming(true);
    try {
      const token = await account.getIdToken();
      await redeemVoucher(token, voucherInput);
      setCheckoutToast(
        '✓ Kode Voucher berhasil diaktifkan! Juru Speedtest Pro terbuka SELAMANYA & 100% bebas iklan.'
      );
      setVoucherInput('');
    } catch (err) {
      setVoucherError(
        err instanceof ApiError ? err.message : 'Gagal mengaktifkan kode voucher.'
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleStartCheckout = async () => {
    setCheckoutError(null);
    if (!account.user) {
      setCheckoutError(
        'Masuk dengan Google terlebih dahulu agar lisensi Selamanya tersimpan di akun Anda.'
      );
      return;
    }
    setIsStartingCheckout(true);
    try {
      const token = await account.getIdToken();
      const { redirectUrl } = await createCheckout(token, 'lifetime_pro');
      window.location.assign(redirectUrl);
    } catch (err) {
      setCheckoutError(
        err instanceof ApiError ? err.message : 'Gagal membuka halaman pembayaran.'
      );
      setIsStartingCheckout(false);
    }
  };

  const waConfirmUrl = `https://wa.me/${MONETIZATION_CONFIG.adminWhatsApp}?text=${encodeURIComponent(
    `Halo Admin Juru Speedtest, saya sudah mencoba fitur optimasi APN dan ingin membuka akses Juru Speedtest Pro Selamanya (${priceLabel}). Mohon info pembayaran QRIS / kode vouchernya.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2.5 backdrop-blur-xs sm:p-5">
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0E1526]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-sm">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-extrabold text-white sm:text-base">
                  Buka Juru Speedtest &amp; APN Pro Selamanya — Hanya {priceLabel}!
                </h3>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Sekali Bayar Seumur Hidup • Tanpa Langganan
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Coba {MONETIZATION_CONFIG.freeTrialLimit}x gratis dulu sampai terasa perbedaannya, lalu buka akses penuh selamanya cukup sekali bayar {priceLabel} via QRIS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {checkoutToast && (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-900 p-3.5 text-xs font-bold text-white shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>{checkoutToast}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 cursor-pointer rounded-lg bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-950 hover:bg-emerald-50"
              >
                Lanjut Gunakan →
              </button>
            </div>
          )}

          {/* Personalized Before-vs-After Proof Banner if user already tested */}
          {baselineEntry && afterEntry && (
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-xs">
              <div className="font-extrabold text-emerald-800 dark:text-emerald-300">
                ✨ Hasil Uji Perbandingan Anda Tercatat:
              </div>
              <p className="mt-0.5 text-slate-700 dark:text-slate-200">
                Sebelum: <strong>{baselineEntry.downloadMbps.toFixed(1)} Mbps</strong> (Ping{' '}
                <strong>{Math.round(baselineEntry.pingMs)} ms</strong>) &rarr; Sesudah pakai{' '}
                <strong>{afterEntry.apnName || afterEntry.apnValue}</strong>:{' '}
                <strong className="text-emerald-700 dark:text-emerald-300">
                  {afterEntry.downloadMbps.toFixed(1)} Mbps
                </strong>{' '}
                (Ping <strong>{Math.round(afterEntry.pingMs)} ms</strong>). Buka akses selamanya sekarang agar bebas menguji kapan pun!
              </p>
            </div>
          )}

          {/* Google Account Binding */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            {account.user ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 text-xs">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    Masuk sebagai {account.user.displayName || account.user.email}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {currentPlan === 'lifetime_pro'
                      ? '✓ Paket Pro Selamanya sudah aktif permanen pada akun Google ini.'
                      : `Status saat ini: Kuota Gratis terpakai ${trialStatus.trialsUsed}/${trialStatus.effectiveTrialLimit}x. Lisensi ${priceLabel} akan tersimpan permanen di akun ini.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => account.signOut()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="max-w-md text-xs text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Masuk dengan Google</strong> terlebih dahulu agar lisensi Selamanya ({priceLabel}) tersimpan di akun Anda dan tetap aktif saat ganti HP.
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={account.loading}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Masuk dengan Google
                </button>
              </div>
            )}
            {authError && (
              <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {authError}
              </p>
            )}
          </div>

          {/* 2-Column Plan Comparison: Coba Gratis 3x vs Buka Selamanya Rp 4.999 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Free 3x Trial Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase dark:bg-slate-700 dark:text-slate-200">
                    Coba Dulu Buktikan (Dengan Iklan)
                  </span>
                  {currentPlan === 'free' && (
                    <span className="text-[10px] font-bold text-slate-500">
                      Sisa {trialStatus.trialsRemaining}/{trialStatus.effectiveTrialLimit}x
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Uji Coba Gratis {MONETIZATION_CONFIG.freeTrialLimit}x
                  </h4>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      Rp 0
                    </span>
                    <span className="text-[11px] text-slate-500">/ {MONETIZATION_CONFIG.freeTrialLimit}x pengujian pertama</span>
                  </div>
                </div>

                <ul className="space-y-1.5 border-t border-slate-200 pt-2.5 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span>1x Uji Awal (Sebelum) + 2x Uji Sesudah Ganti APN</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span>Bandingkan pilihan APN Cepat vs Stabil Main Game</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span>Deteksi otomatis kartu SIM &amp; jaringan Indonesia</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-slate-200/80 px-3 py-2 text-center text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {trialStatus.isPro
                    ? 'Sudah Upgrade ke Pro Selamanya'
                    : trialStatus.isTrialExhausted
                    ? `Kuota ${trialStatus.effectiveTrialLimit}x Gratis Telah Habis`
                    : `Sedang Aktif (Sisa ${trialStatus.trialsRemaining}/${trialStatus.effectiveTrialLimit}x Gratis)`}
                </div>
                {trialStatus.canClaimShareBonus && (
                  <a
                    href={buildViralShareWhatsAppUrl(baselineEntry, afterEntry)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      onClaimShareBonus?.();
                      setCheckoutToast(
                        '🎉 Bonus +1 Kuota Uji Gratis telah ditambahkan karena Anda membagikan Juru Speedtest ke WhatsApp!'
                      );
                    }}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-500/25 dark:text-emerald-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Bagikan ke WA untuk +1 Uji Gratis Ekstra</span>
                  </a>
                )}
              </div>
            </div>

            {/* Lifetime Pro Rp 4.999 Card */}
            <div className="relative flex flex-col justify-between rounded-2xl border-2 border-teal-500 bg-teal-500/[0.06] p-4 shadow-md">
              <div className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-slate-950 uppercase">
                Paling Hemat • Seumur Hidup
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase dark:text-teal-300">
                    Sekali Bayar Selamanya
                  </span>
                  {currentPlan === 'lifetime_pro' && (
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      ✓ AKTIF SELAMANYA
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Juru Speedtest Pro Selamanya
                  </h4>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                      {priceLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      sekali bayar • aktif selamanya!
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5 border-t border-slate-200 pt-2.5 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                    <span>
                      <strong>Unlimited Speedtest &amp; Uji Sebelum vs Sesudah</strong> kapan saja tanpa kuota
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                    <span>
                      <strong>Semua APN Kartu Indonesia</strong> (Telkomsel, by.U, Indosat, Tri, XL, AXIS, Smartfren, Modem)
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                    <span>
                      <strong>Unlimited Racik APN Pintar</strong> (Mode Cepat 5G, Anti-Lag Game &amp; Hotspot DUN) + Profil iOS/Android
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                    <span>
                      <strong>100% Bebas Iklan Selamanya</strong> &amp; Unduh Sertifikat PNG Tanpa Batas
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-xl bg-teal-600/15 px-3 py-2 text-center text-xs font-extrabold text-teal-800 dark:text-teal-300">
                Seharga parkir / gorengan untuk selamanya!
              </div>
            </div>
          </div>

          {/* Checkout Box: QRIS Midtrans + Voucher Code */}
          <div className="space-y-4 rounded-2xl border-2 border-teal-600/40 bg-slate-50 p-4 sm:p-5 dark:bg-slate-800/70">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                  Aktivasi Instan 24 Jam
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                  Total Pembayaran Sekali Seumur Hidup:{' '}
                  <span className="text-teal-700 dark:text-teal-300">{priceLabel}</span>
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Transaksi Resmi Terenkripsi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left: Midtrans QRIS / E-Wallet */}
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-slate-900 bg-white p-2 text-slate-900">
                    <QrCode className="h-12 w-12 text-slate-900" />
                    <span className="mt-0.5 text-[8px] font-extrabold tracking-widest text-slate-900">
                      QRIS {priceLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                      Metode 1 • Otomatis (Midtrans)
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                      Scan QRIS / GoPay / DANA / OVO / ShopeePay
                    </h5>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Mendukung semua aplikasi M-Banking (BCA, Mandiri, BRI, BNI, SeaBank, Jago) &amp; E-Wallet Indonesia. Nominal pas{' '}
                      <strong className="text-slate-900 dark:text-white">{priceLabel}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={isStartingCheckout || currentPlan === 'lifetime_pro'}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-teal-500 disabled:opacity-60"
                  >
                    {isStartingCheckout ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    )}
                    <span>
                      {currentPlan === 'lifetime_pro'
                        ? 'Sudah Aktif Selamanya'
                        : isStartingCheckout
                        ? 'Membuka QRIS...'
                        : `Bayar ${priceLabel} Sekarang`}
                    </span>
                    {!isStartingCheckout && currentPlan !== 'lifetime_pro' && (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <a
                    href={waConfirmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Bantuan WA</span>
                  </a>
                </div>
                {checkoutError && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {checkoutError}
                  </p>
                )}
              </div>

              {/* Right: Voucher Code Redemption */}
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="space-y-1.5">
                  <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Metode 2 • Kode Voucher / PIN Aktivasi
                  </span>
                  <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <span>Punya Kode Voucher Aktivasi?</span>
                  </h5>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Masukkan kode voucher pembelian dari Admin atau promo mitra di bawah ini untuk langsung membuka akses Selamanya:
                  </p>
                </div>

                <form onSubmit={handleApplyVoucher} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={e => setVoucherInput(e.target.value)}
                      placeholder="Masukkan kode voucher"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono-tabular text-xs font-bold text-slate-900 uppercase focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isRedeeming}
                      className="shrink-0 cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      {isRedeeming ? 'Memeriksa...' : 'Aktifkan'}
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {voucherError}
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Legal Links Footer inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span>Dengan melanjutkan pembayaran, Anda menyetujui ketentuan layanan digital:</span>
              <div className="flex flex-wrap items-center gap-3 font-semibold text-teal-700 dark:text-teal-400">
                <a
                  href="/syarat-ketentuan"
                  onClick={e => {
                    if (onOpenLegalPage) {
                      e.preventDefault();
                      onClose();
                      onOpenLegalPage('terms');
                    }
                  }}
                  className="hover:underline"
                >
                  Syarat &amp; Ketentuan
                </a>
                <span>•</span>
                <a
                  href="/kebijakan-pengembalian"
                  onClick={e => {
                    if (onOpenLegalPage) {
                      e.preventDefault();
                      onClose();
                      onOpenLegalPage('refund');
                    }
                  }}
                  className="hover:underline"
                >
                  Kebijakan Refund
                </a>
                <span>•</span>
                <a
                  href="/kebijakan-privasi"
                  onClick={e => {
                    if (onOpenLegalPage) {
                      e.preventDefault();
                      onClose();
                      onOpenLegalPage('privacy');
                    }
                  }}
                  className="hover:underline"
                >
                  Kebijakan Privasi
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

