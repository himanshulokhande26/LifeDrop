import { initializeApp, getApps } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

/**
 * Firebase Client Configuration
 * All values sourced from Vite env variables (VITE_ prefix = safe to expose in browser)
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization (important with Vite HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * getMessagingInstance
 * ---------------------
 * Returns the Firebase Messaging instance only if the browser supports it.
 * FCM requires:
 *   1. A modern browser (Chrome, Edge, Firefox — NOT Safari iOS)
 *   2. The page served over HTTPS (or localhost for dev)
 *   3. A registered Service Worker
 *
 * Returns null if unsupported — callers must handle this gracefully.
 */
export const getMessagingInstance = async () => {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
};

export default app;
