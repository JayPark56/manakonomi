import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Manga, MangaTag, MangaTitle } from '../api/anilist';

const STORAGE_KEY = 'mangataste:userData:v1';

/**
 * Per-manga user record. Title/cover/genres/tags are cached at save time so
 * Library and For You render without re-querying AniList per item.
 */
export interface SavedManga {
  favorite: boolean;
  /** 0.5–5.0 in half-star steps, or null when unrated. */
  rating: number | null;
  title: MangaTitle;
  coverImage: { extraLarge: string | null; large: string | null };
  genres: string[];
  tags: MangaTag[];
  /** Time of the last change to THIS entry (cached-field recency, Library sort). */
  savedAt: number;
  /** Time the rating last changed — used for newest-wins rating merges so an
   *  unrelated favorite toggle can't resurrect a stale rating. */
  ratedAt: number | null;
}

export type UserData = Record<string, SavedManga>;

interface UserDataContextValue {
  data: UserData;
  ready: boolean;
  favoriteOf: (id: number) => boolean;
  ratingOf: (id: number) => number | null;
  toggleFavorite: (manga: Manga) => void;
  setRating: (manga: Manga, rating: number | null) => void;
  /** Replace the whole store (used by cloud sync merge/reconcile). */
  replaceAll: (next: UserData) => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

function baseEntry(manga: Manga, existing: SavedManga | undefined): SavedManga {
  return {
    favorite: existing?.favorite ?? false,
    rating: existing?.rating ?? null,
    ratedAt: existing?.ratedAt ?? null,
    title: manga.title,
    coverImage: manga.coverImage,
    genres: manga.genres,
    tags: manga.tags,
    // Stamp the time of THIS save so cloud sync can pick the newest per manga.
    savedAt: Date.now(),
  };
}

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserData>({});
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData(JSON.parse(raw) as UserData);
      })
      .catch((err: unknown) => console.warn('[userData] failed to load:', err))
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((mutate: (draft: UserData) => UserData) => {
    setData((prev) => {
      const next = mutate(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err: unknown) =>
        console.warn('[userData] failed to persist:', err),
      );
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (manga: Manga) => {
      update((prev) => {
        const key = String(manga.id);
        // Favorite toggle bumps savedAt but NOT ratedAt (rating is unchanged).
        const entry = { ...baseEntry(manga, prev[key]), favorite: !(prev[key]?.favorite ?? false) };
        if (!entry.favorite && entry.rating == null) {
          const { [key]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: entry };
      });
    },
    [update],
  );

  const setRating = useCallback(
    (manga: Manga, rating: number | null) => {
      update((prev) => {
        const key = String(manga.id);
        // Rating change stamps ratedAt so it wins newest-wins merges.
        const entry = { ...baseEntry(manga, prev[key]), rating, ratedAt: Date.now() };
        if (!entry.favorite && entry.rating == null) {
          const { [key]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: entry };
      });
    },
    [update],
  );

  const favoriteOf = useCallback((id: number) => dataRef.current[String(id)]?.favorite ?? false, []);
  const ratingOf = useCallback((id: number) => dataRef.current[String(id)]?.rating ?? null, []);

  const replaceAll = useCallback((next: UserData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err: unknown) =>
      console.warn('[userData] failed to persist:', err),
    );
  }, []);

  const value = useMemo(
    () => ({ data, ready, favoriteOf, ratingOf, toggleFavorite, setRating, replaceAll }),
    [data, ready, favoriteOf, ratingOf, toggleFavorite, setRating, replaceAll],
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used inside UserDataProvider');
  return ctx;
}
