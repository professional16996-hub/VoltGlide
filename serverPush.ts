import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as webPush from 'web-push';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import {
  PushSubscriptionRecord,
  PushNotificationRecord,
  DeviceNotificationState,
  PushNotificationCategory,
  PushSubscriptionStatus,
  PushPlatform
} from './src/types.ts';

export interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushDbSlice {
  vapidKeys?: VapidKeyPair;
  pushSubscriptions?: PushSubscriptionRecord[];
  notifications?: PushNotificationRecord[];
  deviceNotificationStates?: Record<string, DeviceNotificationState>;
}

let firestoreDb: Firestore | null = null;

function getServerFirestore(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!cfg || !cfg.projectId || cfg.projectId === 'remixed-project-id') return null;
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    firestoreDb = getFirestore(app, cfg.firestoreDatabaseId);
    return firestoreDb;
  } catch (err) {
    console.warn('[PushServer] Firestore init fallback to local DB:', err);
    return null;
  }
}

export function normalizePhonePK(p?: string): string {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function makeSubscriptionId(endpoint: string): string {
  const hash = crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 24);
  return `sub_${hash}`;
}

export function initAndGetVapidKeys<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void
): VapidKeyPair {
  const envPub = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const envPriv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:sales@voltglide.com').trim();

  let keys: VapidKeyPair;
  if (envPub && envPriv) {
    keys = { publicKey: envPub, privateKey: envPriv, subject };
  } else {
    const db = loadDb();
    if (db.vapidKeys?.publicKey && db.vapidKeys?.privateKey) {
      keys = {
        publicKey: db.vapidKeys.publicKey,
        privateKey: db.vapidKeys.privateKey,
        subject: db.vapidKeys.subject || subject
      };
    } else {
      const generated = webPush.generateVAPIDKeys();
      keys = {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey,
        subject
      };
      db.vapidKeys = keys;
      saveDb(db);
    }
  }

  try {
    webPush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  } catch (err) {
    console.error('[PushServer] VAPID configuration error:', err);
  }
  return keys;
}

function sanitizeSubForFirestore(sub: PushSubscriptionRecord) {
  const payload: Record<string, unknown> = {
    id: sub.id,
    deviceId: sub.deviceId,
    endpoint: sub.endpoint.slice(0, 2000),
    p256dh: sub.p256dh.slice(0, 500),
    auth: sub.auth.slice(0, 200),
    platform: sub.platform,
    browserLabel: sub.browserLabel.slice(0, 160),
    status: sub.status,
    createdAt: sub.createdAt.slice(0, 60),
    lastVerifiedAt: sub.lastVerifiedAt.slice(0, 60),
    updatedAt: serverTimestamp()
  };
  if (sub.fcmToken) payload.fcmToken = sub.fcmToken.slice(0, 500);
  if (sub.customerId) payload.customerId = sub.customerId.slice(0, 128);
  if (sub.customerName) payload.customerName = sub.customerName.slice(0, 120);
  if (sub.customerPhone) payload.customerPhone = sub.customerPhone.slice(0, 40);
  if (sub.failureReason) payload.failureReason = sub.failureReason.slice(0, 300);
  return payload;
}

async function persistSubscriptionToCloud(sub: PushSubscriptionRecord) {
  const fsDb = getServerFirestore();
  if (!fsDb) return;
  try {
    await setDoc(doc(fsDb, 'push_subscriptions', sub.id), sanitizeSubForFirestore(sub));
  } catch (err) {
    console.warn('[PushServer] Firestore subscription write warning:', err);
  }
}

function sanitizeNotifForFirestore(notif: PushNotificationRecord) {
  const payload: Record<string, unknown> = {
    id: notif.id,
    title: notif.title.slice(0, 160),
    body: notif.body.slice(0, 800),
    category: notif.category,
    url: notif.url.slice(0, 300),
    targetType: notif.targetType,
    sentBy: notif.sentBy,
    sentCount: Math.max(0, Number(notif.sentCount) || 0),
    failedCount: Math.max(0, Number(notif.failedCount) || 0),
    expiredCount: Math.max(0, Number(notif.expiredCount) || 0),
    createdAt: notif.createdAt.slice(0, 60),
    updatedAt: serverTimestamp()
  };
  if (notif.imageUrl) payload.imageUrl = notif.imageUrl.slice(0, 2000);
  if (notif.targetCustomerId) payload.targetCustomerId = notif.targetCustomerId.slice(0, 128);
  if (notif.targetPhone) payload.targetPhone = notif.targetPhone.slice(0, 40);
  return payload;
}

async function persistNotificationToCloud(notif: PushNotificationRecord) {
  const fsDb = getServerFirestore();
  if (!fsDb) return;
  try {
    await setDoc(doc(fsDb, 'notifications', notif.id), sanitizeNotifForFirestore(notif));
  } catch (err) {
    console.warn('[PushServer] Firestore notification write warning:', err);
  }
}

export async function getAllMergedSubscriptions<T extends PushDbSlice>(
  loadDb: () => T
): Promise<PushSubscriptionRecord[]> {
  const db = loadDb();
  const localSubs = Array.isArray(db.pushSubscriptions) ? db.pushSubscriptions : [];
  const map = new Map<string, PushSubscriptionRecord>();
  for (const s of localSubs) {
    if (s && s.id) map.set(s.id, s);
  }

  const fsDb = getServerFirestore();
  if (fsDb) {
    try {
      const snap = await getDocs(collection(fsDb, 'push_subscriptions'));
      snap.forEach((docSnap) => {
        const cloudSub = docSnap.data() as PushSubscriptionRecord;
        if (!cloudSub || !cloudSub.id) return;
        const existing = map.get(cloudSub.id);
        if (!existing) {
          map.set(cloudSub.id, cloudSub);
        } else {
          const cloudTime = new Date(cloudSub.lastVerifiedAt || cloudSub.createdAt || 0).getTime();
          const localTime = new Date(existing.lastVerifiedAt || existing.createdAt || 0).getTime();
          if (cloudTime >= localTime) {
            map.set(cloudSub.id, cloudSub);
          }
        }
      });
    } catch (err) {
      console.warn('[PushServer] Firestore subscriptions fetch warning:', err);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastVerifiedAt || b.createdAt).getTime() - new Date(a.lastVerifiedAt || a.createdAt).getTime()
  );
}

export async function upsertPushSubscription<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  input: {
    deviceId?: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    fcmToken?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    platform?: PushPlatform;
    browserLabel?: string;
  }
): Promise<PushSubscriptionRecord> {
  const db = loadDb();
  if (!Array.isArray(db.pushSubscriptions)) db.pushSubscriptions = [];

  const subId = makeSubscriptionId(input.endpoint);
  const now = new Date().toISOString();
  const existing = db.pushSubscriptions.find((s) => s.id === subId || s.endpoint === input.endpoint);

  const validPlatforms: PushPlatform[] = ['Android', 'iOS', 'Desktop', 'Mobile'];
  const platform: PushPlatform =
    input.platform && validPlatforms.includes(input.platform)
      ? input.platform
      : existing?.platform || 'Desktop';

  const record: PushSubscriptionRecord = {
    id: subId,
    deviceId: (input.deviceId || existing?.deviceId || subId).slice(0, 128),
    endpoint: input.endpoint.slice(0, 2000),
    p256dh: input.keys.p256dh.slice(0, 500),
    auth: input.keys.auth.slice(0, 200),
    fcmToken: input.fcmToken ? input.fcmToken.slice(0, 500) : existing?.fcmToken,
    customerId: input.customerId ? input.customerId.slice(0, 128) : existing?.customerId,
    customerName: input.customerName ? input.customerName.slice(0, 120) : existing?.customerName,
    customerPhone: input.customerPhone ? input.customerPhone.slice(0, 40) : existing?.customerPhone,
    platform,
    browserLabel: (input.browserLabel || existing?.browserLabel || 'Web Browser').slice(0, 160),
    status: 'active',
    createdAt: existing?.createdAt || now,
    lastVerifiedAt: now
  };

  db.pushSubscriptions = [
    record,
    ...db.pushSubscriptions.filter((s) => s.id !== subId && s.endpoint !== input.endpoint)
  ];
  saveDb(db);
  await persistSubscriptionToCloud(record);
  return record;
}

export async function renewPushSubscription<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  params: {
    oldEndpoint?: string | null;
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  }
): Promise<PushSubscriptionRecord> {
  const db = loadDb();
  if (!Array.isArray(db.pushSubscriptions)) db.pushSubscriptions = [];
  const oldSub = params.oldEndpoint
    ? db.pushSubscriptions.find((s) => s.endpoint === params.oldEndpoint)
    : undefined;

  if (oldSub && oldSub.endpoint !== params.subscription.endpoint) {
    oldSub.status = 'expired';
    oldSub.failureReason = 'Rotated by browser pushsubscriptionchange';
    oldSub.lastVerifiedAt = new Date().toISOString();
    await persistSubscriptionToCloud(oldSub);
  }

  return upsertPushSubscription(loadDb, saveDb, {
    deviceId: oldSub?.deviceId,
    endpoint: params.subscription.endpoint,
    keys: params.subscription.keys,
    customerId: oldSub?.customerId,
    customerName: oldSub?.customerName,
    customerPhone: oldSub?.customerPhone,
    platform: oldSub?.platform,
    browserLabel: oldSub?.browserLabel
  });
}

export async function updateSubscriptionStatus<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  params: { id?: string; endpoint?: string; deviceId?: string; status: PushSubscriptionStatus; failureReason?: string }
): Promise<boolean> {
  const all = await getAllMergedSubscriptions(loadDb);
  const targets = all.filter(
    (s) =>
      (params.id && s.id === params.id) ||
      (params.endpoint && s.endpoint === params.endpoint) ||
      (params.deviceId && s.deviceId === params.deviceId)
  );
  if (targets.length === 0) return false;

  const db = loadDb();
  if (!Array.isArray(db.pushSubscriptions)) db.pushSubscriptions = [];
  const now = new Date().toISOString();

  for (const target of targets) {
    const updated: PushSubscriptionRecord = {
      ...target,
      status: params.status,
      lastVerifiedAt: now,
      failureReason: params.failureReason ? params.failureReason.slice(0, 300) : undefined
    };
    if (params.status === 'active') {
      delete updated.failureReason;
    }
    db.pushSubscriptions = [
      updated,
      ...db.pushSubscriptions.filter((s) => s.id !== updated.id)
    ];
    await persistSubscriptionToCloud(updated);
  }
  saveDb(db);
  return true;
}

export async function deletePushSubscriptionRecord<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  subId: string
): Promise<boolean> {
  const db = loadDb();
  if (Array.isArray(db.pushSubscriptions)) {
    db.pushSubscriptions = db.pushSubscriptions.filter((s) => s.id !== subId);
    saveDb(db);
  }
  const fsDb = getServerFirestore();
  if (fsDb) {
    try {
      await deleteDoc(doc(fsDb, 'push_subscriptions', subId));
    } catch (err) {
      console.warn('[PushServer] Firestore subscription delete warning:', err);
    }
  }
  return true;
}

export async function getAllMergedNotifications<T extends PushDbSlice>(
  loadDb: () => T
): Promise<PushNotificationRecord[]> {
  const db = loadDb();
  const localList = Array.isArray(db.notifications) ? db.notifications : [];
  const map = new Map<string, PushNotificationRecord>();
  for (const n of localList) {
    if (n && n.id) map.set(n.id, n);
  }

  const fsDb = getServerFirestore();
  if (fsDb) {
    try {
      const snap = await getDocs(collection(fsDb, 'notifications'));
      snap.forEach((docSnap) => {
        const cloudNotif = docSnap.data() as PushNotificationRecord;
        if (cloudNotif && cloudNotif.id) {
          map.set(cloudNotif.id, cloudNotif);
        }
      });
    } catch (err) {
      console.warn('[PushServer] Firestore notifications fetch warning:', err);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteNotificationRecord<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  notifId: string
): Promise<boolean> {
  const db = loadDb();
  if (Array.isArray(db.notifications)) {
    db.notifications = db.notifications.filter((n) => n.id !== notifId);
    saveDb(db);
  }
  const fsDb = getServerFirestore();
  if (fsDb) {
    try {
      await deleteDoc(doc(fsDb, 'notifications', notifId));
    } catch (err) {
      console.warn('[PushServer] Firestore notification delete warning:', err);
    }
  }
  return true;
}

export async function getDeviceNotifState<T extends PushDbSlice>(
  loadDb: () => T,
  deviceId: string
): Promise<DeviceNotificationState> {
  const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const db = loadDb();
  const localState = db.deviceNotificationStates?.[safeId];

  const fsDb = getServerFirestore();
  if (fsDb && safeId) {
    try {
      const snap = await getDoc(doc(fsDb, 'device_notification_state', safeId));
      if (snap.exists()) {
        return snap.data() as DeviceNotificationState;
      }
    } catch {}
  }

  return (
    localState || {
      deviceId: safeId,
      readIds: [],
      dismissedIds: []
    }
  );
}

export async function updateDeviceNotifState<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  deviceId: string,
  action: {
    action: 'mark_read' | 'mark_all_read' | 'dismiss' | 'clear_history';
    notificationId?: string;
    allNotificationIds?: string[];
  }
): Promise<DeviceNotificationState> {
  const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const current = await getDeviceNotifState(loadDb, safeId);
  const readSet = new Set<string>(Array.isArray(current.readIds) ? current.readIds : []);
  const dismissedSet = new Set<string>(Array.isArray(current.dismissedIds) ? current.dismissedIds : []);
  let clearedBefore = current.clearedBefore;

  if (action.action === 'mark_read' && action.notificationId) {
    readSet.add(action.notificationId);
  } else if (action.action === 'mark_all_read') {
    for (const id of action.allNotificationIds || []) {
      readSet.add(id);
    }
  } else if (action.action === 'dismiss' && action.notificationId) {
    dismissedSet.add(action.notificationId);
    readSet.add(action.notificationId);
  } else if (action.action === 'clear_history') {
    for (const id of action.allNotificationIds || []) {
      dismissedSet.add(id);
    }
    clearedBefore = new Date().toISOString();
  }

  const nextState: DeviceNotificationState = {
    deviceId: safeId,
    readIds: Array.from(readSet).slice(-450),
    dismissedIds: Array.from(dismissedSet).slice(-450),
    ...(clearedBefore ? { clearedBefore } : {})
  };

  const db = loadDb();
  if (!db.deviceNotificationStates) db.deviceNotificationStates = {};
  db.deviceNotificationStates[safeId] = nextState;
  saveDb(db);

  const fsDb = getServerFirestore();
  if (fsDb && safeId) {
    try {
      await setDoc(doc(fsDb, 'device_notification_state', safeId), {
        ...nextState,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[PushServer] Firestore device notification state save warning:', err);
    }
  }

  return nextState;
}

export async function sendBackgroundPushNotification<T extends PushDbSlice>(
  loadDb: () => T,
  saveDb: (db: T) => void,
  params: {
    id?: string;
    title: string;
    body: string;
    category?: PushNotificationCategory;
    url?: string;
    imageUrl?: string;
    targetType?: 'all' | 'customer';
    targetCustomerId?: string;
    targetPhone?: string;
    sentBy?: 'Admin' | 'System';
  }
): Promise<{
  notification: PushNotificationRecord;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  expiredCount: number;
}> {
  initAndGetVapidKeys(loadDb, saveDb);

  const allSubs = await getAllMergedSubscriptions(loadDb);
  const targetType = params.targetType === 'customer' ? 'customer' : 'all';
  const targetPhoneNorm = normalizePhonePK(params.targetPhone);

  const eligibleSubs = allSubs.filter((sub) => {
    if (sub.status !== 'active') return false;
    if (!sub.endpoint || !sub.p256dh || !sub.auth) return false;
    if (targetType === 'customer') {
      const idMatch = params.targetCustomerId && sub.customerId === params.targetCustomerId;
      const phoneMatch = targetPhoneNorm && normalizePhonePK(sub.customerPhone) === targetPhoneNorm;
      return Boolean(idMatch || phoneMatch);
    }
    return true;
  });

  const cleanParamId = params.id ? params.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) : '';
  const notifId = cleanParamId || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const validCategories: PushNotificationCategory[] = ['offer', 'order', 'new_arrival', 'announcement', 'general'];
  const category = params.category && validCategories.includes(params.category) ? params.category : 'general';
  const url = (params.url || '/').trim() || '/';

  const pushPayload = JSON.stringify({
    notificationId: notifId,
    title: params.title.trim().slice(0, 160),
    body: params.body.trim().slice(0, 800),
    category,
    url,
    imageUrl: params.imageUrl?.trim() || undefined,
    icon: '/images/electric_scooty_blue_1793645309587.jpg',
    createdAt: now
  });

  let sentCount = 0;
  let failedCount = 0;
  let expiredCount = 0;

  const db = loadDb();
  if (!Array.isArray(db.pushSubscriptions)) db.pushSubscriptions = [];

  await Promise.all(
    eligibleSubs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          pushPayload,
          {
            TTL: 86400,
            urgency: 'high'
          }
        );
        sentCount += 1;
      } catch (err: any) {
        const statusCode = Number(err?.statusCode || 0);
        const msg = String(err?.body || err?.message || 'Push delivery failed');
        const isExpired =
          statusCode === 410 ||
          statusCode === 404 ||
          /gone|expired|unregistered|notregistered|unsubscribe/i.test(msg);

        if (isExpired) {
          expiredCount += 1;
          const expiredSub: PushSubscriptionRecord = {
            ...sub,
            status: 'expired',
            failureReason: `${statusCode || 'Expired'}: ${msg}`.slice(0, 280),
            lastVerifiedAt: now
          };
          db.pushSubscriptions = [
            expiredSub,
            ...db.pushSubscriptions!.filter((s) => s.id !== sub.id)
          ];
          await persistSubscriptionToCloud(expiredSub);
        } else {
          failedCount += 1;
          console.warn(`[PushServer] Delivery failed for ${sub.id} (${statusCode}):`, msg);
        }
      }
    })
  );

  const notifRecord: PushNotificationRecord = {
    id: notifId,
    title: params.title.trim().slice(0, 160),
    body: params.body.trim().slice(0, 800),
    category,
    url: url.slice(0, 300),
    ...(params.imageUrl?.trim() ? { imageUrl: params.imageUrl.trim().slice(0, 2000) } : {}),
    targetType,
    ...(params.targetCustomerId ? { targetCustomerId: params.targetCustomerId } : {}),
    ...(params.targetPhone ? { targetPhone: params.targetPhone } : {}),
    sentBy: params.sentBy === 'System' ? 'System' : 'Admin',
    sentCount,
    failedCount,
    expiredCount,
    createdAt: now
  };

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(notifRecord);
  db.notifications = db.notifications.slice(0, 300);
  saveDb(db);
  await persistNotificationToCloud(notifRecord);

  return {
    notification: notifRecord,
    targetedCount: eligibleSubs.length,
    sentCount,
    failedCount,
    expiredCount
  };
}
