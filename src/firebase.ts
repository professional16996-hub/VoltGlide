import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Order,
  SiteSettings,
  Product,
  Banner,
  PushSubscriptionRecord,
  PushNotificationRecord,
  DeviceNotificationState
} from './types.ts';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// ================= CROSS-DEVICE ADMIN CREDENTIAL SYNC =================

const SECRET_SALT = 'voltglide_sec_v1:';
const ADMIN_DOC_PATH = 'app_config/admin_security';

export interface CloudAdminSecurityDoc {
  email: string;
  pinHash: string;
  passwordHash: string;
  lastProofHash: string;
  updatedAt?: unknown;
}

export async function hashAdminSecret(secret: string): Promise<string> {
  const input = `${SECRET_SALT}${secret.trim()}`;
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensureCloudAdminSecurity(): Promise<CloudAdminSecurityDoc | null> {
  const ref = doc(db, 'app_config', 'admin_security');
  try {
    const snap = await getDocFromServer(ref);
    if (snap.exists()) {
      return snap.data() as CloudAdminSecurityDoc;
    }
    // Bootstrap initial default hashed credentials on first ever boot
    const defaultPinHash = await hashAdminSecret('12345');
    const defaultPassHash = await hashAdminSecret('admin12345');
    const initialDoc: CloudAdminSecurityDoc = {
      email: 'admin@voltglide.com',
      pinHash: defaultPinHash,
      passwordHash: defaultPassHash,
      lastProofHash: defaultPinHash,
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, initialDoc);
    return initialDoc;
  } catch (error) {
    console.warn('Cloud admin security bootstrap warning:', error);
    return null;
  }
}

export async function verifyCloudAdminLogin(
  mode: 'pin' | 'password',
  params: { pin?: string; email?: string; password?: string }
): Promise<{ ok: boolean; proofHash?: string; email?: string; cloudAvailable: boolean }> {
  const cloudDoc = await ensureCloudAdminSecurity();
  if (!cloudDoc) {
    return { ok: false, cloudAvailable: false };
  }

  if (mode === 'pin') {
    const enteredHash = await hashAdminSecret(params.pin || '');
    if (enteredHash === cloudDoc.pinHash) {
      return { ok: true, proofHash: enteredHash, email: cloudDoc.email, cloudAvailable: true };
    }
    return { ok: false, cloudAvailable: true };
  }

  const cleanEmail = (params.email || '').trim().toLowerCase();
  const enteredHash = await hashAdminSecret(params.password || '');
  const emailMatches = cleanEmail === cloudDoc.email.toLowerCase();
  const passMatches = enteredHash === cloudDoc.passwordHash || enteredHash === cloudDoc.pinHash;
  if (emailMatches && passMatches) {
    return { ok: true, proofHash: enteredHash, email: cloudDoc.email, cloudAvailable: true };
  }
  return { ok: false, cloudAvailable: true };
}

export async function updateCloudAdminSecurity(params: {
  newPin?: string;
  newPassword?: string;
  newEmail?: string;
  proofHash?: string;
}): Promise<{ success: boolean; email?: string }> {
  const ref = doc(db, 'app_config', 'admin_security');
  try {
    const currentDoc = await ensureCloudAdminSecurity();
    if (!currentDoc) {
      return { success: false };
    }

    const activeProof =
      params.proofHash ||
      sessionStorage.getItem('voltglide_admin_proof_hash') ||
      currentDoc.pinHash;

    const nextEmail = params.newEmail && params.newEmail.trim()
      ? params.newEmail.trim().toLowerCase()
      : currentDoc.email;

    const nextPinHash = params.newPin && params.newPin.trim()
      ? await hashAdminSecret(params.newPin.trim())
      : currentDoc.pinHash;

    const nextPassHash = params.newPassword && params.newPassword.trim()
      ? await hashAdminSecret(params.newPassword.trim())
      : currentDoc.passwordHash;

    const nextProof = params.newPin
      ? nextPinHash
      : params.newPassword
        ? nextPassHash
        : activeProof;

    try {
      sessionStorage.setItem('voltglide_admin_proof_hash', nextProof);
    } catch {}

    await setDoc(ref, {
      email: nextEmail,
      pinHash: nextPinHash,
      passwordHash: nextPassHash,
      lastProofHash: activeProof,
      updatedAt: serverTimestamp()
    });

    return { success: true, email: nextEmail };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, ADMIN_DOC_PATH);
    return { success: false };
  }
}

export function subscribeToCloudAdminSecurity(onUpdate: (docData: CloudAdminSecurityDoc) => void) {
  const ref = doc(db, 'app_config', 'admin_security');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CloudAdminSecurityDoc);
      }
    },
    (error) => {
      console.warn('Admin security snapshot warning:', error);
    }
  );
}

// ================= CROSS-DEVICE SITE SETTINGS & ORDERS SYNC =================

export async function saveCloudSiteSettings(settings: SiteSettings): Promise<boolean> {
  const ref = doc(db, 'site_settings', 'main');
  try {
    await setDoc(ref, {
      phone: settings.phone || '0321-0424424',
      whatsappNumber: settings.whatsappNumber || '03210424424',
      whatsappMessage: settings.whatsappMessage || '',
      email: settings.email || 'sales@voltglide.com',
      workingHours: settings.workingHours || '',
      socialLinks: settings.socialLinks || {},
      announcementBar: settings.announcementBar || { enabled: true, text: '' },
      heroBadge: settings.heroBadge || '',
      heroTagline: settings.heroTagline || '',
      deliveryNotice: settings.deliveryNotice || '',
      footerText: settings.footerText || '',
      showrooms: Array.isArray(settings.showrooms) ? settings.showrooms.slice(0, 12) : [],
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Cloud settings save warning:', error);
    return false;
  }
}

export function subscribeToCloudSiteSettings(onUpdate: (settings: Partial<SiteSettings>) => void) {
  const ref = doc(db, 'site_settings', 'main');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Partial<SiteSettings>);
      }
    },
    (error) => {
      console.warn('Cloud settings listener warning:', error);
    }
  );
}

function sanitizeOrderForCloud(order: Order) {
  const safeId = String(order.id || `ORD-${Date.now().toString().slice(-6)}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const validPayments = ['Cash on Delivery', 'Bank Transfer / Raast', 'Online Card'] as const;
  const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as const;
  const safeItems = Array.isArray(order.items)
    ? order.items.map((item) => ({
        productId: String(item.productId || ''),
        productName: String(item.productName || 'Scooty').slice(0, 120),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image:
          item.image && item.image.length <= 150000
            ? item.image
            : '/images/electric_scooty_blue_1793645309587.jpg',
        selectedColor: item.selectedColor ? String(item.selectedColor).slice(0, 40) : ''
      }))
    : [];

  return {
    safeId,
    payload: {
      id: safeId,
      customerId: String(order.customerId || '').slice(0, 120),
      accountType: order.accountType === 'Registered' ? 'Registered' : 'Guest',
      customerName: String(order.customerName || 'Customer').trim().slice(0, 120) || 'Customer',
      customerPhone: (String(order.customerPhone || '03000000000').trim() || '03000000000').padEnd(5, '0').slice(0, 40),
      alternatePhone: String(order.alternatePhone || '').trim().slice(0, 40),
      customerEmail: String(order.customerEmail || '').trim().slice(0, 120),
      cnic: String(order.cnic || '').trim().slice(0, 30),
      shippingAddress: String(order.shippingAddress || 'Pakistan').trim().slice(0, 400) || 'Pakistan',
      areaLandmark: String(order.areaLandmark || '').trim().slice(0, 160),
      city: String(order.city || 'Lahore').trim().slice(0, 80) || 'Lahore',
      items: safeItems,
      totalAmount: Math.max(0, Number(order.totalAmount) || 0),
      paymentMethod: validPayments.includes(order.paymentMethod as any)
        ? order.paymentMethod
        : 'Cash on Delivery',
      notes: String(order.notes || '').slice(0, 300),
      status: validStatuses.includes(order.status as any) ? order.status : 'Pending',
      createdAt: String(order.createdAt || new Date().toISOString()).slice(0, 60),
      updatedAt: serverTimestamp()
    }
  };
}

export async function saveCloudOrder(order: Order): Promise<boolean> {
  const { safeId, payload } = sanitizeOrderForCloud(order);
  const ref = doc(db, 'orders', safeId);
  try {
    await setDoc(ref, payload);
    return true;
  } catch (error) {
    console.warn('Cloud order save warning:', error);
    return false;
  }
}

export async function updateCloudOrderStatus(
  orderId: string,
  status: Order['status'],
  fallbackOrder?: Order
): Promise<boolean> {
  const safeId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const ref = doc(db, 'orders', safeId);
  try {
    const snap = await getDocFromServer(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        status,
        updatedAt: serverTimestamp()
      });
      return true;
    }
    if (fallbackOrder) {
      return await saveCloudOrder({ ...fallbackOrder, id: safeId, status });
    }
    return false;
  } catch (error) {
    console.warn('Cloud order status update warning:', error);
    if (fallbackOrder) {
      return await saveCloudOrder({ ...fallbackOrder, id: safeId, status });
    }
    return false;
  }
}

export async function deleteCloudOrder(orderId: string): Promise<boolean> {
  const safeId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await deleteDoc(doc(db, 'orders', safeId));
    return true;
  } catch (error) {
    console.warn('Cloud order delete warning:', error);
    return false;
  }
}

export async function fetchCloudOrders(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const list: Order[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Order);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Cloud orders fetch warning:', error);
    return [];
  }
}

export function subscribeToCloudOrders(onUpdate: (orders: Order[]) => void) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const list: Order[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Order);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Cloud orders listener warning:', error);
    }
  );
}

// ================= CROSS-DEVICE PRODUCTS & BANNERS SYNC =================

function sanitizeProductForCloud(product: Product) {
  const safeId = product.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeImage = product.image && product.image.length <= 850000
    ? product.image
    : '/images/electric_scooty_blue_1793645309587.jpg';
  const safeGallery = Array.isArray(product.gallery)
    ? product.gallery.filter((g) => typeof g === 'string' && g.length <= 200000).slice(0, 6)
    : [safeImage];
  const payload: Record<string, unknown> = {
    id: safeId,
    name: String(product.name || 'VoltGlide Scooty').slice(0, 160),
    category: ['Electric', 'Petrol', 'Sports', 'Kids', 'City'].includes(product.category)
      ? product.category
      : 'Electric',
    brand: String(product.brand || 'VoltGlide').slice(0, 80),
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
    image: safeImage,
    gallery: safeGallery,
    shortDescription: String(product.shortDescription || '').slice(0, 500),
    description: String(product.description || '').slice(0, 4000),
    features: Array.isArray(product.features) ? product.features : [],
    specs: product.specs || {},
    availability: ['In Stock', 'Limited Stock', 'Pre-Order', 'Out of Stock'].includes(product.availability)
      ? product.availability
      : 'In Stock',
    rating: Number(product.rating) || 5.0,
    reviewCount: Number(product.reviewCount) || 0,
    featured: Boolean(product.featured),
    createdAt: String(product.createdAt || new Date().toISOString()).slice(0, 60),
    updatedAt: serverTimestamp()
  };
  if (product.videoUrl && product.videoUrl.length <= 200000) {
    payload.videoUrl = product.videoUrl;
  }
  return { safeId, payload };
}

export async function ensureCloudProductsSeeded(fallbackProducts: Product[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty && fallbackProducts.length > 0) {
      await Promise.all(
        fallbackProducts.map((p) => {
          const { safeId, payload } = sanitizeProductForCloud(p);
          return setDoc(doc(db, 'products', safeId), payload);
        })
      );
    }
  } catch (error) {
    console.warn('Cloud products seed warning:', error);
  }
}

export async function saveCloudProduct(product: Product, allProductsFallback?: Product[]): Promise<boolean> {
  try {
    if (allProductsFallback && allProductsFallback.length > 0) {
      await ensureCloudProductsSeeded(allProductsFallback);
    }
    const { safeId, payload } = sanitizeProductForCloud(product);
    await setDoc(doc(db, 'products', safeId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud product save warning:', error);
    return false;
  }
}

export async function deleteCloudProduct(productId: string, allProductsFallback?: Product[]): Promise<boolean> {
  try {
    if (allProductsFallback && allProductsFallback.length > 0) {
      await ensureCloudProductsSeeded(allProductsFallback);
    }
    const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
    await deleteDoc(doc(db, 'products', safeId));
    return true;
  } catch (error) {
    console.warn('Cloud product delete warning:', error);
    return false;
  }
}

export function subscribeToCloudProducts(onUpdate: (products: Product[]) => void) {
  return onSnapshot(
    collection(db, 'products'),
    (snap) => {
      if (!snap.empty) {
        const list: Product[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      }
    },
    (error) => {
      console.warn('Cloud products listener warning:', error);
    }
  );
}

function sanitizeBannerForCloud(banner: Banner) {
  const safeId = banner.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const payload: Record<string, unknown> = {
    id: safeId,
    tag: String(banner.tag || 'PROMOTION').slice(0, 80),
    title: String(banner.title || 'Special Promotion').slice(0, 160),
    subtitle: String(banner.subtitle || '').slice(0, 400),
    ctaText: String(banner.ctaText || 'Shop Now').slice(0, 80),
    ctaLink: String(banner.ctaLink || '/scooties').slice(0, 200),
    bgGradient: String(banner.bgGradient || 'from-blue-900 via-slate-900 to-black').slice(0, 160),
    active: Boolean(banner.active),
    updatedAt: serverTimestamp()
  };
  if (banner.image && banner.image.length <= 850000) {
    payload.image = banner.image;
  }
  if (banner.videoUrl && banner.videoUrl.length <= 200000) {
    payload.videoUrl = banner.videoUrl;
  }
  return { safeId, payload };
}

export async function ensureCloudBannersSeeded(fallbackBanners: Banner[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    if (snap.empty && fallbackBanners.length > 0) {
      await Promise.all(
        fallbackBanners.map((b) => {
          const { safeId, payload } = sanitizeBannerForCloud(b);
          return setDoc(doc(db, 'banners', safeId), payload);
        })
      );
    }
  } catch (error) {
    console.warn('Cloud banners seed warning:', error);
  }
}

export async function saveCloudBanner(banner: Banner, allBannersFallback?: Banner[]): Promise<boolean> {
  try {
    if (allBannersFallback && allBannersFallback.length > 0) {
      await ensureCloudBannersSeeded(allBannersFallback);
    }
    const { safeId, payload } = sanitizeBannerForCloud(banner);
    await setDoc(doc(db, 'banners', safeId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud banner save warning:', error);
    return false;
  }
}

export async function deleteCloudBanner(bannerId: string, allBannersFallback?: Banner[]): Promise<boolean> {
  try {
    if (allBannersFallback && allBannersFallback.length > 0) {
      await ensureCloudBannersSeeded(allBannersFallback);
    }
    const safeId = bannerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    await deleteDoc(doc(db, 'banners', safeId));
    return true;
  } catch (error) {
    console.warn('Cloud banner delete warning:', error);
    return false;
  }
}

export function subscribeToCloudBanners(onUpdate: (banners: Banner[]) => void) {
  return onSnapshot(
    collection(db, 'banners'),
    (snap) => {
      if (!snap.empty) {
        const list: Banner[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Banner);
        });
        onUpdate(list);
      }
    },
    (error) => {
      console.warn('Cloud banners listener warning:', error);
    }
  );
}

// ================= PERMANENT FCM & PUSH NOTIFICATIONS CLOUD SYNC =================

export async function getFcmRegistrationToken(
  vapidKey: string,
  serviceWorkerRegistration: ServiceWorkerRegistration
): Promise<string | undefined> {
  try {
    const messagingMod = await import('firebase/messaging');
    const supported = await messagingMod.isSupported();
    if (!supported) return undefined;
    const messaging = messagingMod.getMessaging(app);
    const token = await messagingMod.getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration
    });
    return token || undefined;
  } catch (err) {
    // Gracefully fall back to standard W3C WebPush PushSubscription endpoint (also routes via fcm.googleapis.com on Chrome/Android)
    console.info('FCM optional token fallback to WebPush endpoint:', err instanceof Error ? err.message : String(err));
    return undefined;
  }
}

function sanitizePushSubscriptionForCloud(sub: PushSubscriptionRecord) {
  const safeId = String(sub.id || `sub_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const validPlatforms = ['Android', 'iOS', 'Desktop', 'Mobile'] as const;
  const validStatuses = ['active', 'expired', 'unsubscribed'] as const;
  const payload: Record<string, unknown> = {
    id: safeId,
    deviceId: String(sub.deviceId || safeId).slice(0, 128),
    endpoint: String(sub.endpoint || '').slice(0, 2000),
    p256dh: String(sub.p256dh || '').slice(0, 500),
    auth: String(sub.auth || '').slice(0, 200),
    platform: validPlatforms.includes(sub.platform as any) ? sub.platform : 'Desktop',
    browserLabel: String(sub.browserLabel || 'Web Browser').slice(0, 160),
    status: validStatuses.includes(sub.status as any) ? sub.status : 'active',
    createdAt: String(sub.createdAt || new Date().toISOString()).slice(0, 60),
    lastVerifiedAt: String(sub.lastVerifiedAt || new Date().toISOString()).slice(0, 60),
    updatedAt: serverTimestamp()
  };

  if (sub.fcmToken) payload.fcmToken = String(sub.fcmToken).slice(0, 500);
  if (sub.customerId) payload.customerId = String(sub.customerId).slice(0, 128);
  if (sub.customerName) payload.customerName = String(sub.customerName).slice(0, 120);
  if (sub.customerPhone) payload.customerPhone = String(sub.customerPhone).slice(0, 40);
  if (sub.failureReason) payload.failureReason = String(sub.failureReason).slice(0, 300);

  return { safeId, payload };
}

export async function saveCloudPushSubscription(sub: PushSubscriptionRecord): Promise<boolean> {
  const { safeId, payload } = sanitizePushSubscriptionForCloud(sub);
  try {
    await setDoc(doc(db, 'push_subscriptions', safeId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud push subscription save warning:', error);
    return false;
  }
}

export async function fetchCloudPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'push_subscriptions'));
    const list: PushSubscriptionRecord[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as PushSubscriptionRecord);
    });
    return list.sort((a, b) => new Date(b.lastVerifiedAt || b.createdAt).getTime() - new Date(a.lastVerifiedAt || a.createdAt).getTime());
  } catch (error) {
    console.warn('Cloud push subscriptions fetch warning:', error);
    return [];
  }
}

export function subscribeToCloudPushSubscriptions(onUpdate: (subs: PushSubscriptionRecord[]) => void) {
  return onSnapshot(
    collection(db, 'push_subscriptions'),
    (snap) => {
      const list: PushSubscriptionRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as PushSubscriptionRecord);
      });
      list.sort((a, b) => new Date(b.lastVerifiedAt || b.createdAt).getTime() - new Date(a.lastVerifiedAt || a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Cloud push subscriptions listener warning:', error);
    }
  );
}

export async function deleteCloudPushSubscription(subId: string): Promise<boolean> {
  const safeId = subId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await deleteDoc(doc(db, 'push_subscriptions', safeId));
    return true;
  } catch (error) {
    console.warn('Cloud push subscription delete warning:', error);
    return false;
  }
}

function sanitizeNotificationForCloud(notif: PushNotificationRecord) {
  const safeId = String(notif.id || `notif_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const validCategories = ['offer', 'order', 'new_arrival', 'announcement', 'general'] as const;
  const payload: Record<string, unknown> = {
    id: safeId,
    title: String(notif.title || 'VoltGlide Alert').trim().slice(0, 160) || 'VoltGlide Alert',
    body: String(notif.body || '').trim().slice(0, 800) || 'New update from VoltGlide Scooty Hub.',
    category: validCategories.includes(notif.category as any) ? notif.category : 'general',
    url: String(notif.url || '/').trim().slice(0, 300) || '/',
    targetType: notif.targetType === 'customer' ? 'customer' : 'all',
    sentBy: notif.sentBy === 'System' ? 'System' : 'Admin',
    sentCount: Math.max(0, Number(notif.sentCount) || 0),
    failedCount: Math.max(0, Number(notif.failedCount) || 0),
    expiredCount: Math.max(0, Number(notif.expiredCount) || 0),
    createdAt: String(notif.createdAt || new Date().toISOString()).slice(0, 60),
    updatedAt: serverTimestamp()
  };

  if (notif.imageUrl && notif.imageUrl.length <= 2000) {
    payload.imageUrl = String(notif.imageUrl).slice(0, 2000);
  }
  if (notif.targetCustomerId) {
    payload.targetCustomerId = String(notif.targetCustomerId).slice(0, 128);
  }
  if (notif.targetPhone) {
    payload.targetPhone = String(notif.targetPhone).slice(0, 40);
  }

  return { safeId, payload };
}

export async function saveCloudNotification(notif: PushNotificationRecord): Promise<boolean> {
  const { safeId, payload } = sanitizeNotificationForCloud(notif);
  try {
    await setDoc(doc(db, 'notifications', safeId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud notification save warning:', error);
    return false;
  }
}

export async function fetchCloudNotifications(): Promise<PushNotificationRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const list: PushNotificationRecord[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as PushNotificationRecord);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Cloud notifications fetch warning:', error);
    return [];
  }
}

export function subscribeToCloudNotifications(onUpdate: (items: PushNotificationRecord[]) => void) {
  return onSnapshot(
    collection(db, 'notifications'),
    (snap) => {
      const list: PushNotificationRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as PushNotificationRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Cloud notifications listener warning:', error);
    }
  );
}

export async function deleteCloudNotification(notifId: string): Promise<boolean> {
  const safeId = notifId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await deleteDoc(doc(db, 'notifications', safeId));
    return true;
  } catch (error) {
    console.warn('Cloud notification delete warning:', error);
    return false;
  }
}

export async function fetchCloudDeviceNotificationState(deviceId: string): Promise<DeviceNotificationState | null> {
  const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  if (!safeId) return null;
  try {
    const snap = await getDocFromServer(doc(db, 'device_notification_state', safeId));
    if (snap.exists()) {
      return snap.data() as DeviceNotificationState;
    }
    return null;
  } catch (error) {
    console.warn('Cloud device notification state fetch warning:', error);
    return null;
  }
}

export async function saveCloudDeviceNotificationState(state: DeviceNotificationState): Promise<boolean> {
  const safeId = String(state.deviceId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  if (!safeId) return false;
  try {
    const payload: Record<string, unknown> = {
      deviceId: safeId,
      readIds: Array.isArray(state.readIds) ? state.readIds.slice(-450) : [],
      dismissedIds: Array.isArray(state.dismissedIds) ? state.dismissedIds.slice(-450) : [],
      updatedAt: serverTimestamp()
    };
    if (state.clearedBefore) {
      payload.clearedBefore = String(state.clearedBefore).slice(0, 60);
    }
    await setDoc(doc(db, 'device_notification_state', safeId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud device notification state save warning:', error);
    return false;
  }
}
