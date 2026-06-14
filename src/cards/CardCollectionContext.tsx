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

// Separate from the manga store ('mangataste:userData:v1') — never mixed.
const STORAGE_KEY = 'manakonomi:cardCollection:v1';

/**
 * A collected card: the full card snapshot (so the collection + its detail
 * render offline) plus the collect time. Price is captured at collect time and
 * may be stale until refreshed.
 */
export interface CollectedCard extends TcgCard {
  savedAt: number;
}

export type CardCollection = Record<string, CollectedCard>;

interface CardCollectionContextValue {
  collection: CardCollection;
  ready: boolean;
  isCollected: (id: string) => boolean;
  toggle: (card: TcgCard) => void;
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
        if (raw) setCollection(JSON.parse(raw) as CardCollection);
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
    (card: TcgCard) => {
      setCollection((prev) => {
        let next: CardCollection;
        if (prev[card.id]) {
          const { [card.id]: _removed, ...rest } = prev;
          next = rest;
        } else {
          next = { ...prev, [card.id]: { ...card, savedAt: Date.now() } };
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
