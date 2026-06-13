/**
 * ============================================================================
 * USER-CONFIGURED FIREBASE SETUP — paste your own values here (or via env).
 * ============================================================================
 *
 * Until real values are provided, isFirebaseConfigured() returns false and the
 * whole app runs in GUEST MODE with no Firebase calls — nothing crashes.
 *
 * Each field falls back to a clearly-marked "YOUR_..." placeholder, and can be
 * overridden with an EXPO_PUBLIC_* env var (in .env / app config) so real keys
 * are never committed to source.
 *
 * ── Where to get these ──────────────────────────────────────────────────────
 * firebaseConfig:
 *   Firebase console → Project settings (gear) → General →
 *   "Your apps" → Web app (</>) → "SDK setup and configuration" → Config.
 *
 * googleOAuth client IDs (for expo-auth-session native sign-in):
 *   Google Cloud console → APIs & Services → Credentials →
 *   "OAuth 2.0 Client IDs". Create one client per platform:
 *     • Web application      → webClientId
 *     • iOS                  → iosClientId
 *     • Android              → androidClientId
 *   (On web, Firebase signInWithPopup uses the firebaseConfig above directly,
 *    so webClientId mainly matters for the native auth-session flow.)
 * ────────────────────────────────────────────────────────────────────────────
 */

// Firebase web config for the "manakonomi" project. EXPO_PUBLIC_FIREBASE_* env
// vars still take precedence; these are the committed fallback defaults.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyBxhrMgCfzRUoKyOi0IqDKZ8PcQnbXM6x0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'manakonomi.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'manakonomi',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'manakonomi.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '763924910106',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:763924910106:web:e5c60a0a6cde5a454101a3',
};

// TODO: paste your Google OAuth 2.0 client IDs (or set EXPO_PUBLIC_GOOGLE_* env vars).
export const googleOAuth = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
    'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
};

/**
 * True only when the essential fields have been filled with real values.
 * Used everywhere to gate Firebase so a half-configured project stays in
 * guest mode instead of throwing at runtime.
 */
export function isFirebaseConfigured(): boolean {
  const required = [firebaseConfig.apiKey, firebaseConfig.projectId, firebaseConfig.appId];
  return required.every((v) => typeof v === 'string' && v.length > 0 && !v.startsWith('YOUR_'));
}

/** Google sign-in additionally needs a real web OAuth client id (native flow). */
export function isGoogleNativeConfigured(): boolean {
  return isFirebaseConfigured() && !googleOAuth.webClientId.startsWith('YOUR_');
}
