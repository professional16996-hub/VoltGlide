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

const DEVICE_ID_KEY = 'voltglide_push_device_id';
const SUBSCRIBED_REMEMBER_KEY = 'voltglide_push_remembered';
const ENDPOINT_CACHE_KEY = 'voltglide_push_endpoint';
const SUBSCRIPTION_ID_KEY = 'voltglide_push_sub_id';
const SW_URL = '/firebase-messaging-sw.js';
const IDB_NAME = 'voltglide_push_store';
const IDB_STORE = 'meta';

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
  try {
    const local = localStorage.getItem(DEVICE_ID_KEY);
    if (local && /^[a-zA-Z0-9_-]{8,128}$/.test(local)) {
      await idbSet(DEVICE_ID_KEY, local);
      return local;
    }
    const idbVal = await idbGet(DEVICE_ID_KEY);
    if (idbVal && /^[a-zA-Z0-9_-]{8,128}$/.test(idbVal)) {
      localStorage.setItem(DEVICE_ID_KEY, idbVal);
      return idbVal;
    }
  } catch {}

  const fresh = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    localStorage.setItem(DEVICE_ID_KEY, fresh);
  } catch {}
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
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  if (!isIos) return false;
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return !isStandalone && !('PushManager' in window);
}

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('Service Worker registration warning:', err);
    return null;
  }
}

export async function fetchServerVapidKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && json.publicKey) {
      return String(json.publicKey);
    }
  } catch {}
  return null;
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

  try {
    localStorage.setItem(SUBSCRIBED_REMEMBER_KEY, 'true');
    localStorage.setItem(ENDPOINT_CACHE_KEY, endpoint);
    localStorage.setItem(SUBSCRIPTION_ID_KEY, subId);
  } catch {}
  await idbSet(SUBSCRIBED_REMEMBER_KEY, 'true');
  await idbSet(ENDPOINT_CACHE_KEY, endpoint);

  // 1. Save to Express Backend (permanent store + Firestore server sync)
  try {
    const res = await fetch('/api/push/subscribe', {
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
    });
    if (res.ok) {
      const apiJson = await res.json();
      if (apiJson?.data) {
        return apiJson.data as PushSubscriptionRecord;
      }
    }
  } catch (err) {
    console.warn('Backend push subscribe warning:', err);
  }

  // 2. Also save directly to Cloud Firestore as backup
  await saveCloudPushSubscription(localRecord);
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

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked in browser settings. Please allow notifications for this site in your browser lock/site settings.'
          : 'Notification permission was dismissed.',
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
  if (!registration) {
    return {
      success: false,
      message: 'Could not register Service Worker for background notifications.',
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
  if (!vapidPublicKey) {
    return {
      success: false,
      message: 'Push server VAPID key unavailable. Please try again in a moment.',
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

  const serverKeyBytes = urlBase64ToUint8Array(vapidPublicKey);
  let browserSub = await registration.pushManager.getSubscription();

  // If an old/mismatched key exists, cleanly rotate it
  if (browserSub) {
    const currentKey = browserSub.options?.applicationServerKey;
    if (!uint8ArraysEqual(currentKey, serverKeyBytes)) {
      try {
        await browserSub.unsubscribe();
      } catch {}
      browserSub = null;
    }
  }

  if (!browserSub) {
    browserSub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverKeyBytes as BufferSource
    });
  }

  const fcmToken = await getFcmRegistrationToken(vapidPublicKey, registration);
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
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL) || (await navigator.serviceWorker.ready);
      const sub = await reg?.pushManager?.getSubscription();
      const endpoint = sub?.endpoint || localStorage.getItem(ENDPOINT_CACHE_KEY) || undefined;
      if (sub) {
        await sub.unsubscribe();
      }
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, endpoint })
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Unsubscribe warning:', err);
  }

  try {
    localStorage.setItem(SUBSCRIBED_REMEMBER_KEY, 'false');
    localStorage.removeItem(ENDPOINT_CACHE_KEY);
  } catch {}
  await idbSet(SUBSCRIBED_REMEMBER_KEY, 'false');

  return {
    supported: isWebPushSupported(),
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
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

  const permission = Notification.permission;
  const rememberedLocal =
    localStorage.getItem(SUBSCRIBED_REMEMBER_KEY) === 'true' ||
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
  const browserSub = reg ? await reg.pushManager.getSubscription() : null;
  const cachedEndpoint =
    browserSub?.endpoint || localStorage.getItem(ENDPOINT_CACHE_KEY) || (await idbGet(ENDPOINT_CACHE_KEY)) || '';

  // Query backend status for this device/endpoint
  let serverStatus: PushSubscriptionStatus | 'none' = 'none';
  let serverPublicKey: string | null = null;
  try {
    const qs = new URLSearchParams({
      deviceId,
      ...(cachedEndpoint ? { endpoint: cachedEndpoint } : {})
    });
    const res = await fetch(`/api/push/status?${qs.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        serverStatus = json.status || 'none';
        serverPublicKey = json.publicKey || null;
      }
    }
  } catch {}

  // Case 1: Permission granted and browser has an active subscription
  if (permission === 'granted' && browserSub) {
    // If server VAPID key changed OR server marked subscription expired -> auto-renew silently!
    const needsKeyRotation =
      serverPublicKey &&
      !uint8ArraysEqual(browserSub.options?.applicationServerKey, urlBase64ToUint8Array(serverPublicKey));

    if (needsKeyRotation || serverStatus === 'expired') {
      try {
        if (reg && serverPublicKey) {
          await browserSub.unsubscribe().catch(() => {});
          const freshSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(serverPublicKey) as BufferSource
          });
          const fcmToken = await getFcmRegistrationToken(serverPublicKey, reg);
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
      const fcmToken = serverPublicKey && reg ? await getFcmRegistrationToken(serverPublicKey, reg) : undefined;
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
    if (permission === 'granted' && reg && serverPublicKey) {
      // Silently re-subscribe automatically!
      try {
        const freshSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(serverPublicKey) as BufferSource
        });
        const fcmToken = await getFcmRegistrationToken(serverPublicKey, reg);
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
