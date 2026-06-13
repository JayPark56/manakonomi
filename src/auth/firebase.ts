import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

export interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cached: FirebaseHandles | null = null;

/**
 * Lazily initialize Firebase the first time it's actually needed. Returns null
 * when the project is unconfigured (placeholder config) so every caller can
 * cleanly fall back to guest mode without a crash.
 */
export function getFirebase(): FirebaseHandles | null {
  if (!isFirebaseConfigured()) return null;
  if (cached) return cached;

  const app = getApps()[0] ?? initializeApp(firebaseConfig);

  let auth: Auth;
  if (Platform.OS === 'web') {
    // Browser persistence (localStorage) is the default on web.
    auth = getAuth(app);
  } else {
    // React Native needs AsyncStorage persistence. getReactNativePersistence
    // ships in the RN firebase bundle but is omitted from the web type defs,
    // so it's accessed defensively here.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getReactNativePersistence } = require('firebase/auth') as {
        getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
      };
      auth = initializeAuth(app, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        persistence: getReactNativePersistence(AsyncStorage) as any,
      });
    } catch {
      // Already initialized (e.g. fast refresh) — reuse the existing instance.
      auth = getAuth(app);
    }
  }

  cached = { app, auth, db: getFirestore(app) };
  return cached;
}
