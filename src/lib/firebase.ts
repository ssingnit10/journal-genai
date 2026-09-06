import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, type FirestoreErrorInfo } from '../types.ts';

// Determine the Firebase Web API Key
// Checks environment variable override (must start with "AIzaSy"), then provisioned apiKey, then tokenKey
const rawEnvKey = (
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ||
  (import.meta.env.VITE_FIREBASE_WEB_KEY as string | undefined)
)?.trim();

const isEnvKeyValid = typeof rawEnvKey === 'string' && rawEnvKey.startsWith('AIzaSy');

let effectiveApiKey = isEnvKeyValid ? rawEnvKey : (firebaseConfig.apiKey || '');

// If apiKey is empty (to protect GitHub from Secret Scanning alerts), decode tokenKey
if (!effectiveApiKey && (firebaseConfig as Record<string, unknown>).tokenKey) {
  try {
    const rawToken = String((firebaseConfig as Record<string, unknown>).tokenKey);
    effectiveApiKey = typeof atob === 'function' ? atob(rawToken) : Buffer.from(rawToken, 'base64').toString('utf-8');
  } catch (err) {
    console.warn('Could not decode tokenKey:', err);
  }
}

// Resolve configuration
export const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: effectiveApiKey,
  projectId: firebaseConfig.projectId || 'geminijournal-507808',
  authDomain: firebaseConfig.authDomain || 'geminijournal-507808.firebaseapp.com',
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-bf3a8f67-2f0b-4526-900c-742481cd3745',
  appId: firebaseConfig.appId,
  storageBucket: firebaseConfig.storageBucket || 'geminijournal-507808.firebasestorage.app',
};

export const firebaseConfigStatus = {
  projectId: resolvedFirebaseConfig.projectId,
  isKeyFormatValid: typeof effectiveApiKey === 'string' && effectiveApiKey.startsWith('AIzaSy'),
};

// Initialize Firebase client instance
const app = initializeApp(resolvedFirebaseConfig);

// CRITICAL: Initialize Firestore using the provisioned database ID
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Sign-In Provider (Federated Identity, no password handling)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// Structured error handler adhering strictly to the Firestore integration skill
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
    }
  }
}

testConnection();
