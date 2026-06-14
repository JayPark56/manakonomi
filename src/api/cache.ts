import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Last-response cache for AniList GraphQL calls.
 *
 * The service worker can only runtime-cache GET requests, but every AniList
 * call is a POST, so offline data support is handled here at the app layer:
 * successful responses are persisted by query+variables and replayed when the
 * network is unavailable. This is what lets a previously-used search or
 * recommendation screen still show content offline.
 */
const PREFIX = 'mangataste:apicache:';

/** Stable key from a GraphQL query + its variables (djb2 hash). */
export function apiCacheKey(query: string, variables: Record<string, unknown>): string {
  const payload = `${query}|${JSON.stringify(variables)}`;
  let h = 5381;
  for (let i = 0; i < payload.length; i += 1) {
    h = ((h << 5) + h + payload.charCodeAt(i)) | 0;
  }
  return PREFIX + (h >>> 0).toString(36);
}

export async function readApiCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // corrupt entry or storage unavailable — treat as a miss
  }
}

export async function writeApiCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* best-effort; ignore quota / serialization failures */
  }
}

/**
 * TTL-aware cache (used by the TCG client): static set/card data is cached hard
 * while prices use a shorter max-age. Pass maxAgeMs = Infinity to read a stale
 * entry of any age (the offline fallback after a failed fetch).
 */
const TTL_PREFIX = 'manakonomi:ttlcache:';

export async function readCachedWithTTL<T>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(TTL_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; ts: number };
    if (maxAgeMs !== Infinity && Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeCachedWithTTL<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(TTL_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* best-effort */
  }
}
