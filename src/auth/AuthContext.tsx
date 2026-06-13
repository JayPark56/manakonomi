import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebase } from './firebase';
import { googleOAuth, isFirebaseConfigured, isGoogleNativeConfigured } from './firebaseConfig';
import { getAuthMode, setAuthMode } from './authStorage';

// Required so the auth popup/redirect can close and resolve.
WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  /** Persisted local mode: how the user chose to use the app. */
  mode: 'google' | 'guest';
  /** Firebase uid when signed in, else null. */
  uid: string | null;
  /** Whether Firebase has real (non-placeholder) config. */
  configured: boolean;
  /** Sign-in attempt in flight. */
  busy: boolean;
  /** Launches Google sign-in. Resolves true on success. */
  signInWithGoogle: () => Promise<boolean>;
  /** Sign out back to guest mode locally; cloud data is left untouched. */
  signOutToGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [mode, setMode] = useState<'google' | 'guest'>('guest');
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Native auth-session prompt + its pending resolver (registered by the
  // native-only child below). Unused on web.
  const promptRef = useRef<(() => Promise<unknown>) | null>(null);
  const pendingResolve = useRef<((ok: boolean) => void) | null>(null);
  // Re-entrancy guard (state is async, so a ref is checked synchronously).
  const busyRef = useRef(false);

  // Load persisted mode, and (if configured) track Firebase auth state so a
  // previously-signed-in user is recognized on app start.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    getAuthMode().then((m) => setMode(m));
    const fb = getFirebase(); // null when unconfigured → stays guest, no crash
    if (fb) {
      unsub = onAuthStateChanged(fb.auth, (user) => {
        setUid(user?.uid ?? null);
        if (user) {
          setMode('google');
          void setAuthMode('google');
        }
      });
    }
    return () => unsub?.();
  }, []);

  // Finalizes a native auth-session result by exchanging the id token for a
  // Firebase credential.
  const handleNativeIdToken = useCallback((idToken: string | null) => {
    const resolve = pendingResolve.current;
    pendingResolve.current = null;
    const fb = getFirebase();
    if (!idToken || !fb) {
      resolve?.(false);
      return;
    }
    signInWithCredential(fb.auth, GoogleAuthProvider.credential(idToken))
      .then(() => resolve?.(true))
      .catch(() => resolve?.(false));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (busyRef.current) return false; // ignore double-taps / re-entry
    const fb = getFirebase();
    if (!fb) return false; // unconfigured → caller shows a localized error
    busyRef.current = true;
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        await signInWithPopup(fb.auth, new GoogleAuthProvider());
        return true; // onAuthStateChanged sets uid/mode
      }
      // Native: requires a real OAuth client id, else the auth-session child
      // isn't mounted and there is no prompt to run.
      if (!isGoogleNativeConfigured()) return false;
      const prompt = promptRef.current;
      if (!prompt) return false;
      return await new Promise<boolean>((resolve) => {
        pendingResolve.current = resolve;
        void prompt();
      });
    } catch (err) {
      console.warn('[auth] sign-in failed:', err);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const signOutToGuest = useCallback(async () => {
    const fb = getFirebase();
    if (fb) await firebaseSignOut(fb.auth).catch(() => {});
    await setAuthMode('guest');
    setMode('guest');
    setUid(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ mode, uid, configured, busy, signInWithGoogle, signOutToGuest }),
    [mode, uid, configured, busy, signInWithGoogle, signOutToGuest],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Native-only: mounts the expo-auth-session Google hook. Never rendered
          on web (which uses signInWithPopup). Gated on a real OAuth client id
          so a placeholder one never attempts a broken native flow. */}
      {isGoogleNativeConfigured() && Platform.OS !== 'web' && (
        <NativeGoogleSignIn
          registerPrompt={(fn) => {
            promptRef.current = fn;
          }}
          onIdToken={handleNativeIdToken}
        />
      )}
    </AuthContext.Provider>
  );
}

/**
 * Native Google sign-in via expo-auth-session. Calls the hook unconditionally
 * (it's only ever rendered on native), registers its promptAsync, and reports
 * the resulting id token back to the provider.
 */
function NativeGoogleSignIn({
  registerPrompt,
  onIdToken,
}: {
  registerPrompt: (fn: () => Promise<unknown>) => void;
  onIdToken: (idToken: string | null) => void;
}) {
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleOAuth.webClientId,
    iosClientId: googleOAuth.iosClientId,
    androidClientId: googleOAuth.androidClientId,
  });

  useEffect(() => {
    registerPrompt(promptAsync);
  }, [promptAsync, registerPrompt]);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken =
        response.params?.id_token ?? response.authentication?.idToken ?? null;
      onIdToken(idToken);
    } else if (response.type !== 'locked') {
      // cancel / dismiss / error
      onIdToken(null);
    }
  }, [response, onIdToken]);

  return null;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
