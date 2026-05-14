import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Test Firestore connection on boot
const testConnection = async () => {
  try {
    // Try to get a dummy doc from server to verify connectivity
    // Note: This might fail with permission-denied due to our strict rules,
    // which actually confirms the connection to the server is working.
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("CommunityOS: Firestore connection verified.");
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('Insufficient permissions') || errorMessage.includes('permission-denied')) {
      console.log("CommunityOS: Firestore connection verified (Secured).");
    } else if (errorMessage.includes('offline')) {
      console.error("CommunityOS: Firestore is offline. Please check your network.");
    } else {
      console.warn("CommunityOS: Firestore connectivity check returned:", errorMessage);
    }
  }
};

testConnection();
