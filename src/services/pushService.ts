import {
  PushPlatform,
  PushSubscriptionRecord,
  PushSubscriptionStatus,
  CustomerUser
} from '../types.ts';
import {
  getFcmRegistrationToken,
  saveCloudPushSubscription
} from '../firebase.ts';
import {
  safeGetStorage,
  safeSetStorage,
  safeRemoveStorage,
  safeNotificationPermission
} from '../utils/safeStorage.ts';

const DEVICE_ID_KEY = 'voltglide_push_device_id';
const SUBSCRIBED_REMEMBER_KEY = 'voltglide_push_remembered';
const ENDPOINT_CACHE_KEY = 'voltglide_push_endpoint';
const SUBSCRIPTION_ID_KEY = 'voltglide_push_sub_id';
const SW_URL = '/firebase-messaging-sw.js';
const IDB_NAME = 'voltglide_push_store';
const IDB_STORE = 'meta';

// Persistent fallback public VAPID key matching the server keypair so static deploys (e.g. Netlify) never fail to subscribe
const DEFAULT_VAPID_PUBLIC_KEY =
  'BCy4NGCEhIMn9LRuRNV1rTt4Jx8ferex3cwNsBpcty3gwdS_BCrSY3TbKU4yFO49eCiKM9ny2Y37qrNygOkJb0I';

function getConfiguredApiBase(): string {
  try {
    const raw = (import.meta as any)?.env?.VITE_API_BASE_URL;
    return typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
}

export function buildPushApiUrl(path: string): string {
  const base = getConfiguredApiBase();
  return base ? `${base}${path}` : path;
}

async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs = 5000
): Promise<T | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {})
    });
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    // Crucial for Netlify / SPA hosting: ignore HTML index fallback returned with HTTP 200
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface PushClientState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  status: PushSubscriptionStatus | 'none' | 'blocked';
  remembered: boolean;
  isExpired: boolean;
  subscriptionId?: string;
  endpoint?: string;
  platform: PushPlatform;
  browserLabel: string;
  iosNeedsHomeScreen: boolean;
}

function openMetaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openMetaDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openMetaDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getOrCreatePersistentDeviceId(): Promise<string> {
  const local = safeGetStorage(DEVICE_ID_KEY);
  if (local && /^[a-zA-Z0-9_-]{8,128}$/.test(local)) {
    await idbSet(DEVICE_ID_KEY, local);
    return local;
  }
  const idbVal = await idbGet(DEVICE_ID_KEY);
  if (idbVal && /^[a-zA-Z0-9_-]{8,128}$/.test(idbVal)) {
    safeSetStorage(DEVICE_ID_KEY, idbVal);
    return idbVal;
  }

  const fresh = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  safeSetStorage(DEVICE_ID_KEY, fresh);
  await idbSet(DEVICE_ID_KEY, fresh);
  return fresh;
}

export function detectPushPlatform(): PushPlatform {
  if (typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mobile|Tablet/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function getBrowserLabel(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent || '';
  const platform = detectPushPlatform();
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  return `${platform} · ${browser}`;
}

export function isIosSafariWithoutPwa(): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    if (!isIos) return false;
    const isStandalone =
      (window.navigator as any)?.standalone === true ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
    return !isStandalone && !('PushManager' in window);
  } catch {
    return false;
  }
}

export function isWebPushSupported(): boolean {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String.trim() + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isValidVapidPublicKey(key: unknown): key is string {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 80 || trimmed.length > 140) return false;
  try {
    const bytes = urlBase64ToUint8Array(trimmed);
    return bytes.length === 65 && bytes[0] === 0x04;
  } catch {
    return false;
  }
}

function uint8ArraysEqual(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const viewA = new Uint8Array(a);
  if (viewA.length !== b.length) return false;
  for (let i = 0; i < viewA.length; i++) {
    if (viewA[i] !== b[i]) return false;
  }
  return true;
}

async function computeSubId(endpoint: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sub_${hex.slice(0, 24)}`;
  } catch {
    return `sub_${Date.now().toString(36)}`;
  }
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    // Wait up to 6s for SW activation so slow mobile networks never hang forever
    const readyReg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration>((resolve) => setTimeout(() => resolve(reg), 6000))
    ]);
    return readyReg || reg;
  } catch (err) {
    console.warn('Service Worker registration warning:', err);
    try {
      const existing = await navigator.serviceWorker.getRegistration('/');
      return existing || null;
    } catch {
      return null;
    }
  }
}

export async function fetchServerVapidKey(): Promise<string> {
  // 1. Try Express backend endpoint (guarded against SPA HTML fallback)
  const json = await safeFetchJson<{ success?: boolean; publicKey?: string }>(
    buildPushApiUrl('/api/push/vapid-public-key'),
    undefined,
    3500
  );
  if (json?.success && isValidVapidPublicKey(json.publicKey)) {
    return json.publicKey.trim();
  }

  // 2. Try build-time env override
  try {
    const envKey = (import.meta as any)?.env?.VITE_VAPID_PUBLIC_KEY;
    if (isValidVapidPublicKey(envKey)) {
      return envKey.trim();
    }
  } catch {}

  // 3. Persistent project-wide fallback matching Express server's VAPID keypair
  return DEFAULT_VAPID_PUBLIC_KEY;
}

async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const result = Notification.requestPermission();
    if (result && typeof (result as Promise<NotificationPermission>).then === 'function') {
      return await result;
    }
    return await new Promise<NotificationPermission>((resolve) => {
      try {
        (Notification as any).requestPermission((perm: NotificationPermission) => resolve(perm));
      } catch {
        resolve(safeNotificationPermission() === 'unsupported' ? 'default' : (safeNotificationPermission() as NotificationPermission));
      }
    });
  } catch {
    const current = safeNotificationPermission();
    return current === 'unsupported' ? 'denied' : current;
  }
}

async function persistSubscriptionEverywhere(
  browserSub: PushSubscription,
  deviceId: string,
  fcmToken: string | undefined,
  customer?: CustomerUser | null
): Promise<PushSubscriptionRecord> {
  const json = browserSub.toJSON();
  const endpoint = json.endpoint || browserSub.endpoint;
  const p256dh = json.keys?.p256dh || '';
  const auth = json.keys?.auth || '';
  const subId = await computeSubId(endpoint);
  const now = new Date().toISOString();
  const platform = detectPushPlatform();
  const browserLabel = getBrowserLabel();

  const localRecord: PushSubscriptionRecord = {
    id: subId,
    deviceId,
    endpoint,
    p256dh,
    auth,
    ...(fcmToken ? { fcmToken } : {}),
    ...(customer?.id ? { customerId: customer.id } : {}),
    ...(customer?.name ? { customerName: customer.name } : {}),
    ...(customer?.phone ? { customerPhone: customer.phone } : {}),
    platform,
    browserLabel,
    status: 'active',
    createdAt: now,
    lastVerifiedAt: now
  };

  safeSetStorage(SUBSCRIBED_REMEMBER_KEY, 'true');
  safeSetStorage(ENDPOINT_CACHE_KEY, endpoint);
  safeSetStorage(SUBSCRIPTION_ID_KEY, subId);
  await idbSet(SUBSCRIBED_REMEMBER_KEY, 'true');
  await idbSet(ENDPOINT_CACHE_KEY, endpoint);

  // 1. Save directly to Cloud Firestore so static deploys (Netlify) & Cloud Run share one permanent DB
  await saveCloudPushSubscription(localRecord).catch(() => false);

  // 2. Sync to Express Backend when available
  const apiJson = await safeFetchJson<{ success?: boolean; data?: PushSubscriptionRecord }>(
    buildPushApiUrl('/api/push/subscribe'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        subscription: { endpoint, keys: { p256dh, auth } },
        fcmToken,
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        platform,
        browserLabel
      })
    },
    5000
  );

  if (apiJson?.data) {
    return apiJson.data;
  }

  return localRecord;
}

export async function subscribeToPermanentPush(
  customer?: CustomerUser | null
): Promise<{ success: boolean; message: string; state: PushClientState }> {
  const deviceId = await getOrCreatePersistentDeviceId();
  const platform = detectPushPlatform();
  const browserLabel = getBrowserLabel();
  const iosNeedsHomeScreen = isIosSafariWithoutPwa();

  if (!isWebPushSupported()) {
    return {
      success: false,
      message: iosNeedsHomeScreen
        ? 'On iPhone/iPad, tap Share → "Add to Home Screen" first to enable permanent background push alerts.'
        : 'Your browser does not support background Web Push notifications.',
      state: {
        supported: false,
        permission: 'unsupported',
        status: 'none',
        remembered: false,
        isExpired: false,
        platform,
        browserLabel,
        iosNeedsHomeScreen
      }
    };
  }

  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked in browser settings. Tap the lock icon next to the URL and allow Notifications.'
          : 'Notification permission was dismissed. Tap Allow Notifications again when ready.',
      state: {
        supported: true,
        permission,
        status: permission === 'denied' ? 'blocked' : 'none',
        remembered: false,
        isExpired: false,
        platform,
        browserLabel,
        iosNeedsHomeScreen: false
      }
    };
  }

  const registration = await registerPushServiceWorker();
  if (!registration || !registration.pushManager) {
    return {
      success: false,
      message: 'Background notification service is still loading. Please refresh the page and try again.',
      state: {
        supported: true,
        permission,
        status: 'none',
        remembered: false,
        isExpired: false,
        platform,
        browserLabel,
        iosNeedsHomeScreen: false
      }
    };
  }

  const vapidPublicKey = await fetchServerVapidKey();
  const serverKeyBytes = urlBase64ToUint8Array(vapidPublicKey);

  let browserSub: PushSubscription | null = null;
  try {
    browserSub = await registration.pushManager.getSubscription();

    // If an old/mismatched key exists, cleanly rotate it
    if (browserSub) {
      const currentKey = browserSub.options?.applicationServerKey;
      if (!uint8ArraysEqual(currentKey, serverKeyBytes)) {
        await browserSub.unsubscribe().catch(() => {});
        browserSub = null;
      }
    }

    if (!browserSub) {
      try {
        browserSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: serverKeyBytes as BufferSource
        });
      } catch (subErr: any) {
        // Recover automatically if browser complains about an existing mismatched key/state
        const existing = await registration.pushManager.getSubscription().catch(() => null);
        if (existing) {
          await existing.unsubscribe().catch(() => {});
          browserSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: serverKeyBytes as BufferSource
          });
        } else {
          throw subErr;
        }
      }
    }
  } catch (err: any) {
    const errName = err?.name || '';
    const errMsg = err?.message || String(err || '');
    console.warn('PushManager subscribe failed:', errName, errMsg);
    const friendly =
      errName === 'NotAllowedError'
        ? 'Browser blocked push permission. Please check Site Settings → Notifications and set to Allow.'
        : /push service error|AbortError/i.test(`${errName} ${errMsg}`)
        ? 'Your browser push service is temporarily unavailable (check internet or disable strict push blocking in browser settings) and try again.'
        : 'Could not activate background push on this browser. Please try again in normal (non-Incognito) mode.';

    return {
      success: false,
      message: friendly,
      state: {
        supported: true,
        permission,
        status: 'none',
        remembered: false,
        isExpired: false,
        platform,
        browserLabel,
        iosNeedsHomeScreen: false
      }
    };
  }

  const fcmToken = await getFcmRegistrationToken(vapidPublicKey, registration).catch(() => undefined);
  const saved = await persistSubscriptionEverywhere(browserSub, deviceId, fcmToken, customer);

  return {
    success: true,
    message: 'Permanent background notifications enabled! Alerts will arrive even when website is closed or phone restarts.',
    state: {
      supported: true,
      permission: 'granted',
      status: 'active',
      remembered: true,
      isExpired: false,
      subscriptionId: saved.id,
      endpoint: saved.endpoint,
      platform,
      browserLabel,
      iosNeedsHomeScreen: false
    }
  };
}

export async function unsubscribeFromPermanentPush(): Promise<PushClientState> {
  const deviceId = await getOrCreatePersistentDeviceId();
  const platform = detectPushPlatform();
  const browserLabel = getBrowserLabel();

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration(SW_URL)) ||
        (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000))
        ]));
      const sub = await reg?.pushManager?.getSubscription();
      const endpoint = sub?.endpoint || safeGetStorage(ENDPOINT_CACHE_KEY) || undefined;
      if (sub) {
        await sub.unsubscribe().catch(() => {});
      }
      await fetch(buildPushApiUrl('/api/push/unsubscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, endpoint })
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Unsubscribe warning:', err);
  }

  safeSetStorage(SUBSCRIBED_REMEMBER_KEY, 'false');
  safeRemoveStorage(ENDPOINT_CACHE_KEY);
  await idbSet(SUBSCRIBED_REMEMBER_KEY, 'false');

  return {
    supported: isWebPushSupported(),
    permission: safeNotificationPermission(),
    status: 'unsubscribed',
    remembered: false,
    isExpired: false,
    platform,
    browserLabel,
    iosNeedsHomeScreen: isIosSafariWithoutPwa()
  };
}

export async function inspectAndSyncPushState(customer?: CustomerUser | null): Promise<PushClientState> {
  const deviceId = await getOrCreatePersistentDeviceId();
  const platform = detectPushPlatform();
  const browserLabel = getBrowserLabel();
  const iosNeedsHomeScreen = isIosSafariWithoutPwa();

  if (!isWebPushSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      status: 'none',
      remembered: false,
      isExpired: false,
      platform,
      browserLabel,
      iosNeedsHomeScreen
    };
  }

  const permission = safeNotificationPermission();
  const rememberedLocal =
    safeGetStorage(SUBSCRIBED_REMEMBER_KEY) === 'true' ||
    (await idbGet(SUBSCRIBED_REMEMBER_KEY)) === 'true';

  if (permission === 'denied') {
    return {
      supported: true,
      permission: 'denied',
      status: 'blocked',
      remembered: rememberedLocal,
      isExpired: rememberedLocal,
      platform,
      browserLabel,
      iosNeedsHomeScreen: false
    };
  }

  const reg = await registerPushServiceWorker();
  let browserSub: PushSubscription | null = null;
  try {
    browserSub = reg?.pushManager ? await reg.pushManager.getSubscription() : null;
  } catch {
    browserSub = null;
  }

  const cachedEndpoint =
    browserSub?.endpoint || safeGetStorage(ENDPOINT_CACHE_KEY) || (await idbGet(ENDPOINT_CACHE_KEY)) || '';

  // Query backend status for this device/endpoint (with JSON content-type guard)
  let serverStatus: PushSubscriptionStatus | 'none' = 'none';
  let serverPublicKey: string | null = null;
  const qs = new URLSearchParams({
    deviceId,
    ...(cachedEndpoint ? { endpoint: cachedEndpoint } : {})
  });
  const statusJson = await safeFetchJson<{
    success?: boolean;
    status?: PushSubscriptionStatus | 'none';
    publicKey?: string;
  }>(buildPushApiUrl(`/api/push/status?${qs.toString()}`), undefined, 3500);

  if (statusJson?.success) {
    serverStatus = statusJson.status || 'none';
    if (isValidVapidPublicKey(statusJson.publicKey)) {
      serverPublicKey = statusJson.publicKey.trim();
    }
  }

  const activeVapidKey = serverPublicKey || (await fetchServerVapidKey());

  // Case 1: Permission granted and browser has an active subscription
  if (permission === 'granted' && browserSub) {
    const needsKeyRotation =
      isValidVapidPublicKey(activeVapidKey) &&
      !uint8ArraysEqual(browserSub.options?.applicationServerKey, urlBase64ToUint8Array(activeVapidKey));

    if (needsKeyRotation || serverStatus === 'expired') {
      try {
        if (reg && isValidVapidPublicKey(activeVapidKey)) {
          await browserSub.unsubscribe().catch(() => {});
          const freshSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(activeVapidKey) as BufferSource
          });
          const fcmToken = await getFcmRegistrationToken(activeVapidKey, reg).catch(() => undefined);
          const saved = await persistSubscriptionEverywhere(freshSub, deviceId, fcmToken, customer);
          return {
            supported: true,
            permission: 'granted',
            status: 'active',
            remembered: true,
            isExpired: false,
            subscriptionId: saved.id,
            endpoint: saved.endpoint,
            platform,
            browserLabel,
            iosNeedsHomeScreen: false
          };
        }
      } catch (err) {
        console.warn('Auto-renew failed:', err);
        return {
          supported: true,
          permission: 'granted',
          status: 'expired',
          remembered: true,
          isExpired: true,
          endpoint: browserSub.endpoint,
          platform,
          browserLabel,
          iosNeedsHomeScreen: false
        };
      }
    }

    // If user didn't explicitly unsubscribe, keep subscription synced with backend/Firestore + link customer info if logged in
    if (serverStatus !== 'unsubscribed') {
      const fcmToken =
        isValidVapidPublicKey(activeVapidKey) && reg
          ? await getFcmRegistrationToken(activeVapidKey, reg).catch(() => undefined)
          : undefined;
      const saved = await persistSubscriptionEverywhere(browserSub, deviceId, fcmToken, customer);
      return {
        supported: true,
        permission: 'granted',
        status: 'active',
        remembered: true,
        isExpired: false,
        subscriptionId: saved.id,
        endpoint: saved.endpoint,
        platform,
        browserLabel,
        iosNeedsHomeScreen: false
      };
    }
  }

  // Case 2: User WAS remembered as subscribed (or server says expired), but browser subscription disappeared
  if ((rememberedLocal && serverStatus !== 'unsubscribed') || serverStatus === 'expired') {
    if (permission === 'granted' && reg && isValidVapidPublicKey(activeVapidKey)) {
      try {
        const freshSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(activeVapidKey) as BufferSource
        });
        const fcmToken = await getFcmRegistrationToken(activeVapidKey, reg).catch(() => undefined);
        const saved = await persistSubscriptionEverywhere(freshSub, deviceId, fcmToken, customer);
        return {
          supported: true,
          permission: 'granted',
          status: 'active',
          remembered: true,
          isExpired: false,
          subscriptionId: saved.id,
          endpoint: saved.endpoint,
          platform,
          browserLabel,
          iosNeedsHomeScreen: false
        };
      } catch {}
    }

    return {
      supported: true,
      permission,
      status: 'expired',
      remembered: true,
      isExpired: true,
      platform,
      browserLabel,
      iosNeedsHomeScreen: false
    };
  }

  return {
    supported: true,
    permission,
    status: serverStatus === 'unsubscribed' ? 'unsubscribed' : 'none',
    remembered: false,
    isExpired: false,
    platform,
    browserLabel,
    iosNeedsHomeScreen: false
  };
}
