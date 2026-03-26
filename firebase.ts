import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfigJson from './firebase-applet-config.json';

// Use the config directly from the JSON file
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with the named database and fallback to (default) if needed
let dbInstance;
const namedDatabaseId = firebaseConfigJson.firestoreDatabaseId;

try {
  if (namedDatabaseId && namedDatabaseId !== '(default)') {
    console.log('Attempting to initialize Firestore with named database ID:', namedDatabaseId);
    dbInstance = getFirestore(app, namedDatabaseId);
  } else {
    console.log('No named database ID provided, using (default).');
    dbInstance = getFirestore(app);
  }
} catch (e) {
  console.warn('Failed to initialize Firestore with named database, falling back to (default):', e);
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();
