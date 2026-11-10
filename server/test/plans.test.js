import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, applyPlanGrant, effectivePlan, loadVouchers } from '../src/plans.js';

const NOW = 1_700_000_000_000;

test('PLANS: harga paket lifetime_pro terkunci di Rp 4.999 dan berlaku selamanya', () => {
  assert.equal(PLANS.lifetime_pro.price, 4999);
  assert.equal(PLANS.lifetime_pro.durationDays, null);
});

test('effectivePlan: membaca speedtestPlan tanpa bentrok dengan field aplikasi lain', () => {
  assert.equal(effectivePlan(undefined, NOW), 'free');
  assert.equal(effectivePlan({ plan: 'single_case' }, NOW), 'free');
  assert.equal(effectivePlan({ speedtestPlan: 'lifetime_pro', speedtestPlanExpiresAt: null }, NOW), 'lifetime_pro');
  assert.equal(effectivePlan({ speedtestPlan: 'lifetime_pro', speedtestPlanExpiresAt: NOW - 1 }, NOW), 'free');
  assert.equal(effectivePlan({ speedtestPlan: 'lifetime_pro', speedtestPlanExpiresAt: NOW + 1000 }, NOW), 'lifetime_pro');
  assert.equal(effectivePlan({ speedtestPlan: 'hacker' }, NOW), 'free');
});

test('applyPlanGrant: mengaktifkan lifetime_pro selamanya (planExpiresAt = null)', () => {
  const g1 = applyPlanGrant(undefined, 'lifetime_pro', NOW);
  assert.deepEqual(g1, { plan: 'lifetime_pro', planExpiresAt: null, changed: true });

  const g2 = applyPlanGrant(
    { speedtestPlan: 'lifetime_pro', speedtestPlanExpiresAt: null },
    'lifetime_pro',
    NOW + 50_000
  );
  assert.deepEqual(g2, { plan: 'lifetime_pro', planExpiresAt: null, changed: false });
});

test('loadVouchers: kode dinormalkan huruf besar; kosong = tidak ada voucher', () => {
  const v = loadVouchers({ VOUCHER_LIFETIME_PRO: ' juru4999 ,GAMERPRO,, ' });
  assert.equal(v.get('JURU4999'), 'lifetime_pro');
  assert.equal(v.get('GAMERPRO'), 'lifetime_pro');
  assert.equal(loadVouchers({}).size, 0);
});

