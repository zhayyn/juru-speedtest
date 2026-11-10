import React, { useEffect, useRef, useState } from 'react';
import { Crown, ExternalLink, Megaphone, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '../types/speedtest';
import { MONETIZATION_CONFIG } from '../config/monetization-config';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface MonetizationAdBannerProps {
  subscriptionPlan: SubscriptionPlan;
  city?: string;
  isp?: string;
  onOpenPricing: () => void;
  placement?: 'top' | 'bottom';
}

export const MonetizationAdBanner: React.FC<MonetizationAdBannerProps> = ({
  subscriptionPlan,
  city = 'Indonesia',
  isp = 'Seluler & Fiber',
  onOpenPricing,
  placement = 'bottom',
}) => {
  const [adIndex, setAdIndex] = useState<number>(placement === 'top' ? 0 : 1);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (subscriptionPlan !== 'free' || !MONETIZATION_CONFIG.adsense.enabled) return;
    const clientId = MONETIZATION_CONFIG.adsense.clientId;
    if (!clientId) return;

    const existingScript = document.querySelector(`script[data-adsense-client="${clientId}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        clientId
      )}`;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-adsense-client', clientId);
      document.head.appendChild(script);
    }

    const activeSlot =
      placement === 'top'
        ? MONETIZATION_CONFIG.adsense.topSlotId
        : MONETIZATION_CONFIG.adsense.bottomSlotId;

    if (activeSlot && !pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // AdBlocker atau domain belum aktif - abaikan dengan aman
      }
    }
  }, [subscriptionPlan, placement]);

  // Pengguna Lifetime Pro (Rp 4.999) 100% Bebas Iklan Selamanya
  if (subscriptionPlan !== 'free') {
    return null;
  }

  const ads = MONETIZATION_CONFIG.sponsorAds;
  const activeAd = ads[adIndex % ads.length] || ads[0];

  return (
    <div className="mt-6 rounded-2xl border border-amber-200/90 bg-amber-50/55 p-3.5 shadow-xs transition-all sm:p-4 dark:border-slate-800 dark:bg-slate-900/75">
      {/* Top Bar: Label Sponsor + Tombol Hilangkan Iklan Selamanya Rp 4.999 */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-950 uppercase dark:bg-amber-950/80 dark:text-amber-300">
            <Megaphone className="h-3 w-3" />
            <span>Sponsor &amp; Info Mitra • {city}</span>
          </span>
          <button
            type="button"
            onClick={() => setAdIndex(prev => (prev + 1) % ads.length)}
            className="cursor-pointer text-[10px] font-semibold text-slate-500 underline hover:text-slate-800 dark:text-slate-400"
          >
            Ganti Info ({(adIndex % ads.length) + 1}/{ads.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPricing}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-extrabold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          <Crown className="h-3 w-3 text-amber-500" />
          <span>Hilangkan Iklan Selamanya ({MONETIZATION_CONFIG.pricing.lifetimeLabel})</span>
        </button>
      </div>

      {/* Kontainer Google AdSense Resmi apabila slot dikonfigurasi */}
      {MONETIZATION_CONFIG.adsense.enabled &&
        Boolean(
          placement === 'top'
            ? MONETIZATION_CONFIG.adsense.topSlotId
            : MONETIZATION_CONFIG.adsense.bottomSlotId
        ) && (
          <div className="mb-3 overflow-hidden rounded-xl bg-white p-2 text-center dark:bg-slate-950">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={MONETIZATION_CONFIG.adsense.clientId}
              data-ad-slot={
                placement === 'top'
                  ? MONETIZATION_CONFIG.adsense.topSlotId
                  : MONETIZATION_CONFIG.adsense.bottomSlotId
              }
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}

      {/* Konten Banner Sponsor Mandiri */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
              {activeAd.partnerName}
            </span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Pengguna {isp} ({city})
            </span>
          </div>
          <h4 className="text-xs leading-snug font-bold text-slate-900 sm:text-sm dark:text-white">
            {activeAd.headline}
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {activeAd.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={activeAd.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-500"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{activeAd.ctaText}</span>
            <ExternalLink className="h-3 w-3 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};

