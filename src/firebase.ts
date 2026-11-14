import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Order, SiteSettings } from './types.ts';

const app = initializeApp(firebaseConfig);
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

export async function saveCloudOrder(order: Order): Promise<boolean> {
  const safeId = order.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const ref = doc(db, 'orders', safeId);
  try {
    await setDoc(ref, {
      id: safeId,
      customerId: order.customerId || '',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
      shippingAddress: order.shippingAddress,
      city: order.city,
      items: order.items || [],
      totalAmount: Number(order.totalAmount) || 0,
      paymentMethod: order.paymentMethod || 'Cash on Delivery',
      notes: order.notes || '',
      status: order.status || 'Pending',
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Cloud order save warning:', error);
    return false;
  }
}

export async function updateCloudOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  const safeId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const ref = doc(db, 'orders', safeId);
  try {
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Cloud order status update warning:', error);
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
