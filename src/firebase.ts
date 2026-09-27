import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence for seamless in-store shopping
const dbId = firebaseConfigJson.firestoreDatabaseId || undefined;
let db: ReturnType<typeof getFirestore>;

try {
  db = dbId 
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, dbId)
    : initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
} catch (e) {
  db = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const auth = getAuth(app);
export { db };
export default app;
