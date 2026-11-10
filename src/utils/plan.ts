import type { SubscriptionPlan } from '../types/speedtest';
import { MONETIZATION_CONFIG } from '../config/monetization-config';

export const FREE_TRIAL_LIMIT = MONETIZATION_CONFIG.freeTrialLimit; // 9x gratis dasar

/**
 * Paket efektif dari dokumen users/{uid}.
 * Mendukung field khusus `speedtestPlan` (agar aman berbagi proyek Firebase yang sama dengan JuruHukum)
 * maupun fallback `plan === 'lifetime_pro'`.
 * Paket `lifetime_pro` berlaku selamanya (tidak kedaluwarsa kecuali dibatalkan/refund).
 */
export function resolveEffectivePlan(
  doc:
    | {
        speedtestPlan?: unknown;
        speedtestPlanExpiresAt?: unknown;
        plan?: unknown;
        planExpiresAt?: unknown;
      }
    | undefined,
  now: number = Date.now()
): SubscriptionPlan {
  if (!doc) return 'free';

  if (doc.speedtestPlan === 'lifetime_pro') {
    if (
      typeof doc.speedtestPlanExpiresAt === 'number' &&
      doc.speedtestPlanExpiresAt <= now
    ) {
      return 'free';
    }
    return 'lifetime_pro';
  }

  if (doc.plan === 'lifetime_pro') {
    if (typeof doc.planExpiresAt === 'number' && doc.planExpiresAt <= now) {
      return 'free';
    }
    return 'lifetime_pro';
  }

  return 'free';
}

export interface TrialQuotaStatus {
  plan: SubscriptionPlan;
  isPro: boolean;
  trialsUsed: number;
  effectiveTrialLimit: number;
  trialsRemaining: number;
  isTrialExhausted: boolean;
  canUsePremiumFeatures: boolean;
  hasShareBonus: boolean;
  canClaimShareBonus: boolean;
}

export function computeTrialStatus(
  rawTrialsUsed: number,
  plan: SubscriptionPlan,
  hasShareBonus: boolean = false
): TrialQuotaStatus {
  const isPro = plan === 'lifetime_pro';
  const effectiveTrialLimit = FREE_TRIAL_LIMIT + (hasShareBonus ? 1 : 0);
  const safeUsed = Math.max(0, Math.min(effectiveTrialLimit, Math.floor(rawTrialsUsed || 0)));
  const trialsRemaining = isPro ? Infinity : Math.max(0, effectiveTrialLimit - safeUsed);
  const isTrialExhausted = !isPro && safeUsed >= effectiveTrialLimit;

  return {
    plan,
    isPro,
    trialsUsed: safeUsed,
    effectiveTrialLimit,
    trialsRemaining,
    isTrialExhausted,
    canUsePremiumFeatures: isPro || !isTrialExhausted,
    hasShareBonus,
    canClaimShareBonus: !isPro && !hasShareBonus,
  };
}
