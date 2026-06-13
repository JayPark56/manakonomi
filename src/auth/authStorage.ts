import AsyncStorage from '@react-native-async-storage/async-storage';

/** First-launch onboarding completion flag. */
export const ONBOARDING_KEY = 'onboarding:completed:v1';
/** Persisted auth mode so the splash → home path never re-shows login UI. */
export const AUTH_MODE_KEY = 'auth:mode:v1';

export type AuthMode = 'google' | 'guest';

export async function getOnboardingCompleted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    /* best-effort */
  }
}

export async function getAuthMode(): Promise<AuthMode> {
  try {
    return (await AsyncStorage.getItem(AUTH_MODE_KEY)) === 'google' ? 'google' : 'guest';
  } catch {
    return 'guest';
  }
}

export async function setAuthMode(mode: AuthMode): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_MODE_KEY, mode);
  } catch {
    /* best-effort */
  }
}
