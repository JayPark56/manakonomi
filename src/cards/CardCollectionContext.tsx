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
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TcgCard } from '../tcg/optcgApi';
import type { UnionArenaCard } from '../tcg/unionArenaApi';

// Separate from the manga store ('mangataste:userData:v1') — never mixed.
const STORAGE_KEY = 'manakonomi:cardCollection:v1';

/** Which card game an entry belongs to (avoids id collisions across games). */
export type CardGameSource = 'one-piece' | 'union-arena';

/**
 * A collected card: the full native card snapshot (so the collection + its
 * detail render offline) + which game it is + the collect time. One Piece cards
 * carry a price (captured at collect time, may be stale); Union Arena has none.
 */
export type CollectedCard =
  | (TcgCard & { game: 'one-piece'; savedAt: number })
  | (UnionArenaCard & { game: 'union-arena'; savedAt: number });

/** Discriminated input for collecting a card from either game's screens. */
export type CollectibleInput =
  | { game: 'one-piece'; card: TcgCard }
  | { game: 'union-arena'; card: UnionArenaCard };

export type CardCollection = Record<string, CollectedCard>;

/**
 * Migration-safe ingest: entries saved before multi-game support lack a `game`
 * field — default them to 'one-piece' (the only game that existed then).
 */
export function normalizeCollection(raw: unknown): CardCollection {
  if (!raw || typeof raw !== 'object') return {};
  const out: CardCollection = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const e = value as Record<string, unknown>;
    const game: CardGameSource = e.game === 'union-arena' ? 'union-arena' : 'one-piece';
    out[id] = { ...e, game } as CollectedCard;
  }
  return out;
}

interface CardCollectionContextValue {
  collection: CardCollection;
  ready: boolean;
  isCollected: (id: string) => boolean;
  toggle: (input: CollectibleInput) => void;
  /** Replace the whole collection (used by cloud merge/reconcile). */
  replaceAll: (next: CardCollection) => void;
}

const CardCollectionContext = createContext<CardCollectionContextValue | null>(null);

export function CardCollectionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollection] = useState<CardCollection>({});
  const [ready, setReady] = useState(false);
  const ref = useRef(collection);
  ref.current = collection;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setCollection(normalizeCollection(JSON.parse(raw)));
      })
      .catch((err: unknown) => console.warn('[cardCollection] failed to load:', err))
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: CardCollection) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err: unknown) =>
      console.warn('[cardCollection] failed to persist:', err),
    );
  }, []);

  const toggle = useCallback(
    (input: CollectibleInput) => {
      const id = input.card.id;
      setCollection((prev) => {
        let next: CardCollection;
        if (prev[id]) {
          const { [id]: _removed, ...rest } = prev;
          next = rest;
        } else {
          const entry: CollectedCard =
            input.game === 'one-piece'
              ? { ...input.card, game: 'one-piece', savedAt: Date.now() }
              : { ...input.card, game: 'union-arena', savedAt: Date.now() };
          next = { ...prev, [id]: entry };
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const replaceAll = useCallback(
    (next: CardCollection) => {
      setCollection(next);
      persist(next);
    },
    [persist],
  );

  const isCollected = useCallback((id: string) => ref.current[id] != null, []);

  const value = useMemo(
    () => ({ collection, ready, isCollected, toggle, replaceAll }),
    [collection, ready, isCollected, toggle, replaceAll],
  );

  return <CardCollectionContext.Provider value={value}>{children}</CardCollectionContext.Provider>;
}

export function useCardCollection(): CardCollectionContextValue {
  const ctx = useContext(CardCollectionContext);
  if (!ctx) throw new Error('useCardCollection must be used inside CardCollectionProvider');
  return ctx;
}
