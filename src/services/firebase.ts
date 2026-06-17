import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Type decl to keep user schemas unified
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isGuest?: boolean;
}

// Global instances
let appInstance: any;
let dbInstance: any;
let authInstance: any;

try {
  appInstance = initializeApp(firebaseConfig);
  // Using initializeFirestore with force long polling to solve connectivity inside browser iframes/restricted sandboxes
  dbInstance = initializeFirestore(appInstance, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
  authInstance = getAuth(appInstance);
  console.log("CommunityOS Firebase SDK successfully initialized with Force Long Polling.");
} catch (error) {
  console.error("Firebase SDK Initialization Error:", error);
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;

export { onAuthStateChanged };

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async (): Promise<User> => {
  if (!auth) {
    throw new Error("Sistem Firebase tidak diinisialisasi dengan benar.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  const u = result.user;
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified
  };
};

export const logout = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
};

export async function testConnection() {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'settings', 'app_version'));
    console.log("Koneksi Firestore Server berhasil divalidasi.");
    return true;
  } catch (error) {
    console.warn("Koneksi Firestore gagal atau offline:", error);
    return false;
  }
}

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailing: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
