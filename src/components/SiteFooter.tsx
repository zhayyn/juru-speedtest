import React from 'react';
import { Crown, Gauge, Lock, ShieldCheck } from 'lucide-react';
import { MONETIZATION_CONFIG } from '../config/monetization-config';
import { LEGAL_PAGE_ROUTES, type LegalPageSlug } from './LegalCompliancePages';

interface SiteFooterProps {
  onOpenLegalPage: (page: LegalPageSlug) => void;
  onOpenPricing: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  onOpenLegalPage,
  onOpenPricing,
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: LegalPageSlug) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onOpenLegalPage(slug);
  };

  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/80 px-4 py-8 sm:px-6 dark:border-slate-800/80 dark:bg-[#070B14] print:hidden">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-md space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Gauge className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Juru<span className="text-teal-600 dark:text-teal-400">Speedtest</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Instrumen uji kecepatan internet, analisis latensi beban (<em>bufferbloat</em>), perbandingan Sebelum vs Sesudah, serta basis data profil APN seluruh operator seluler Indonesia untuk Streaming Cepat &amp; Gaming Stabil.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-teal-500" />
                <span>Pembayaran QRIS Aman via Midtrans</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                <span>Privasi Data Lokal (UU PDP)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:grid-cols-3">
            <a
              href={LEGAL_PAGE_ROUTES.terms.path}
              onClick={e => handleLinkClick(e, 'terms')}
              className="font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            >
              Syarat &amp; Ketentuan
            </a>
            <a
              href={LEGAL_PAGE_ROUTES.privacy.path}
              onClick={e => handleLinkClick(e, 'privacy')}
              className="font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            >
              Kebijakan Privasi
            </a>
            <a
              href={LEGAL_PAGE_ROUTES.refund.path}
              onClick={e => handleLinkClick(e, 'refund')}
              className="font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            >
              Kebijakan Refund
            </a>
            <a
              href={LEGAL_PAGE_ROUTES.disclaimer.path}
              onClick={e => handleLinkClick(e, 'disclaimer')}
              className="font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            >
              Disclaimer Teknis
            </a>
            <a
              href={LEGAL_PAGE_ROUTES.contact.path}
              onClick={e => handleLinkClick(e, 'contact')}
              className="font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            >
              Tentang &amp; Kontak
            </a>
            <button
              type="button"
              onClick={onOpenPricing}
              className="inline-flex cursor-pointer items-center gap-1 text-left font-bold text-amber-600 transition hover:text-amber-500 dark:text-amber-400"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Buka Selamanya ({MONETIZATION_CONFIG.pricing.lifetimeLabel})</span>
            </button>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-200/70 pt-4 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <span>
              &copy; {new Date().getFullYear()} Juru Speedtest Indonesia. Seluruh Hak Dilindungi Undang-Undang.
            </span>
            <span>
              Layanan Pelanggan: {MONETIZATION_CONFIG.adminEmail} • WA +62 858-4222-9418
            </span>
          </div>
          <div>
            Coba {MONETIZATION_CONFIG.freeTrialLimit}x gratis penuh sebelum membeli • Akses seumur hidup hanya {MONETIZATION_CONFIG.pricing.lifetimeLabel} sekali bayar.
          </div>
        </div>
      </div>
    </footer>
  );
};
