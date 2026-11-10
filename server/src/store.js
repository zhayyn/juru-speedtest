import { applyPlanGrant } from './plans.js';

/**
 * Penyimpanan Firestore untuk Juru Speedtest. Koleksi:
 *  - users/{uid}            : { speedtestPlan, speedtestPlanExpiresAt, speedtestPlanSource, email, speedtestUpdatedAt }
 *                             (ditulis dengan { merge: true } sehingga aman berbagi proyek Firebase dengan aplikasi Juru lain;
 *                              klien hanya boleh membaca dokumen miliknya sendiri)
 *  - speedtest_orders/{id}  : { uid, plan, amount, status, ... } (klien tidak punya akses)
 */
export function createFirestoreStore(db) {
  const users = db.collection('users');
  const orders = db.collection('speedtest_orders');

  const userUpdate = (grant, source, email, now) => ({
    speedtestPlan: grant.plan,
    speedtestPlanExpiresAt: grant.planExpiresAt,
    speedtestPlanSource: source,
    ...(email ? { email } : {}),
    speedtestUpdatedAt: now,
  });

  return {
    async saveOrder(order) {
      await orders.doc(order.orderId).set(order);
    },

    async getOrder(orderId) {
      const snap = await orders.doc(orderId).get();
      return snap.exists ? snap.data() : undefined;
    },

    async updateOrderStatus(orderId, status) {
      await orders.doc(orderId).update({ status });
    },

    /** Aktivasi paket (voucher / manual) secara transaksional. */
    async grantPlan({ uid, email, plan, source, now }) {
      const ref = users.doc(uid);
      return db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const grant = applyPlanGrant(snap.exists ? snap.data() : undefined, plan, now);
        tx.set(ref, userUpdate(grant, source, email, now), { merge: true });
        return grant;
      });
    },

    /**
     * Menyelesaikan order berdasarkan status Midtrans. Idempoten: order 'paid'
     * tidak akan memproses ulang meskipun webhook dikirim berulang kali.
     */
    async settleOrder({ orderId, newStatus, now }) {
      const orderRef = orders.doc(orderId);
      return db.runTransaction(async tx => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) return { found: false, status: 'unknown' };
        const order = orderSnap.data();

        if (order.status === 'paid') return { found: true, status: 'paid', already: true };

        if (newStatus === 'paid') {
          const userRef = users.doc(order.uid);
          const userSnap = await tx.get(userRef);
          const grant = applyPlanGrant(userSnap.exists ? userSnap.data() : undefined, order.plan, now);
          tx.update(orderRef, { status: 'paid', paidAt: now });
          tx.set(userRef, userUpdate(grant, 'payment', order.email, now), { merge: true });
          return { found: true, status: 'paid', grant };
        }

        if (order.status !== newStatus) tx.update(orderRef, { status: newStatus });
        return { found: true, status: newStatus };
      });
    },
  };
}

/** Penyimpanan memori (untuk tes unit/integrasi & pengembangan lokal tanpa Firestore). */
export function createMemoryStore() {
  const users = new Map();
  const orders = new Map();
  const userUpdate = (grant, source, email, now) => ({
    speedtestPlan: grant.plan,
    speedtestPlanExpiresAt: grant.planExpiresAt,
    speedtestPlanSource: source,
    ...(email ? { email } : {}),
    speedtestUpdatedAt: now,
  });

  return {
    users,
    orders,
    async saveOrder(order) {
      orders.set(order.orderId, { ...order });
    },
    async getOrder(orderId) {
      const o = orders.get(orderId);
      return o ? { ...o } : undefined;
    },
    async updateOrderStatus(orderId, status) {
      orders.get(orderId).status = status;
    },
    async grantPlan({ uid, email, plan, source, now }) {
      const grant = applyPlanGrant(users.get(uid), plan, now);
      users.set(uid, { ...(users.get(uid) || {}), ...userUpdate(grant, source, email, now) });
      return grant;
    },
    async settleOrder({ orderId, newStatus, now }) {
      const order = orders.get(orderId);
      if (!order) return { found: false, status: 'unknown' };
      if (order.status === 'paid') return { found: true, status: 'paid', already: true };
      if (newStatus === 'paid') {
        const grant = applyPlanGrant(users.get(order.uid), order.plan, now);
        order.status = 'paid';
        order.paidAt = now;
        users.set(order.uid, {
          ...(users.get(order.uid) || {}),
          ...userUpdate(grant, 'payment', order.email, now),
        });
        return { found: true, status: 'paid', grant };
      }
      order.status = newStatus;
      return { found: true, status: newStatus };
    },
  };
}

