/* VoltGlide Permanent Background Push & FCM Service Worker */

const DEFAULT_ICON = '/images/electric_scooty_blue_1793645309587.jpg';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function parsePushPayload(event) {
  let raw = {};
  try {
    if (event.data) {
      raw = event.data.json();
    }
  } catch {
    try {
      raw = { body: event.data ? event.data.text() : '' };
    } catch {
      raw = {};
    }
  }

  // Support both FCM payload shapes ({ notification, data }) and WebPush flat payloads
  const notif = raw.notification || {};
  const data = raw.data || {};

  const title = raw.title || notif.title || 'VoltGlide Scooty Hub';
  const body =
    raw.body ||
    notif.body ||
    data.body ||
    'New update from VoltGlide Motors Pakistan.';
  const image = raw.imageUrl || raw.image || notif.image || data.imageUrl || undefined;
  const icon = raw.icon || notif.icon || DEFAULT_ICON;
  const url = raw.url || data.url || (raw.fcmOptions && raw.fcmOptions.link) || '/';
  const notificationId = raw.notificationId || data.notificationId || 'vg-' + Date.now();
  const category = raw.category || data.category || 'general';
  const createdAt = raw.createdAt || data.createdAt || new Date().toISOString();

  return {
    title,
    body,
    image,
    icon,
    url,
    notificationId,
    category,
    createdAt
  };
}

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event);

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: DEFAULT_ICON,
    tag: payload.notificationId,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    data: {
      url: payload.url,
      notificationId: payload.notificationId,
      category: payload.category,
      createdAt: payload.createdAt
    }
  };

  if (payload.image && typeof payload.image === 'string' && payload.image.startsWith('http')) {
    notificationOptions.image = payload.image;
  }

  const showPromise = self.registration.showNotification(payload.title, notificationOptions);

  const notifyClientsPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        try {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload
          });
        } catch {
          // ignore client messaging errors
        }
      }
    });

  event.waitUntil(Promise.all([showPromise, notifyClientsPromise]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const notificationId = event.notification.data && event.notification.data.notificationId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          try {
            client.postMessage({
              type: 'PUSH_NOTIFICATION_CLICKED',
              url: targetUrl,
              notificationId
            });
          } catch {}
          return;
        }
      }
      if (self.clients.openWindow) {
        const resolvedUrl = targetUrl.startsWith('http')
          ? targetUrl
          : self.location.origin + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
        return self.clients.openWindow(resolvedUrl);
      }
    })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Automatically handle browser-initiated subscription rotation or expiration in background
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        let applicationServerKey =
          event.oldSubscription &&
          event.oldSubscription.options &&
          event.oldSubscription.options.applicationServerKey;

        if (!applicationServerKey) {
          const keyRes = await fetch('/api/push/vapid-public-key');
          if (keyRes.ok) {
            const keyJson = await keyRes.json();
            if (keyJson && keyJson.publicKey) {
              applicationServerKey = urlBase64ToUint8Array(keyJson.publicKey);
            }
          }
        }

        if (!applicationServerKey) return;

        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        await fetch('/api/push/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
            subscription: newSubscription.toJSON()
          })
        });
      } catch (err) {
        console.error('[SW] Failed to auto-renew push subscription:', err);
      }
    })()
  );
});
