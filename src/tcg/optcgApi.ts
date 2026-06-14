/**
 * One Piece TCG client.
 *
 * Source: optcgapi.com (the documented optcg-api.arjunbansal-ai.workers.dev API
 * is fully API-key-gated — every endpoint returns 401 "api key required" and a
 * key needs a manual access request — so we use the open optcgapi.com instead).
 *
 * Endpoints (all GET, no key, no pagination — each set/deck returns its full
 * card list with prices + image URLs bundled in):
 *   /api/allSets/         → [{ set_id, set_name }]                (booster sets)
 *   /api/allDecks/        → [{ structure_deck_id, structure_deck_name }] (ST decks)
 *   /api/sets/{OP-XX}/    → full card array for a booster set
 *   /api/decks/{ST-XX}/   → full card array for a starter deck
 */
import { readCachedWithTTL, writeCachedWithTTL } from '../api/cache';

const BASE = 'https://optcgapi.com';
const TIMEOUT_MS = 15000;
const SETS_TTL = 1000 * 60 * 60 * 24 * 30; // set list is static → 30 days
const CARDS_TTL = 1000 * 60 * 60 * 6; // cards bundle prices → 6 hours

export type TcgErrorKind = 'rate-limit' | 'network' | 'server';

export class TcgError extends Error {
  kind: TcgErrorKind;
  constructor(kind: TcgErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export function tcgErrorKind(err: unknown): TcgErrorKind {
  return err instanceof TcgError ? err.kind : 'server';
}

export interface TcgSet {
  id: string;
  name: string;
  /** Starter decks are fetched from a different endpoint than booster sets. */
  kind: 'set' | 'deck';
}

export interface TcgCard {
  id: string; // card_set_id, e.g. "OP01-077"
  name: string;
  setId: string; // "OP-01"
  setName: string;
  rarity: string;
  type: string; // Character / Event / Leader / Stage / DON!!
  color: string | null;
  cost: string | null;
  power: string | null;
  counter: number | null;
  attribute: string | null;
  subTypes: string | null;
  text: string | null;
  marketPrice: number | null;
  image: string;
}

interface RawCard {
  card_set_id?: string;
  card_name?: string;
  set_id?: string;
  set_name?: string;
  rarity?: string;
  card_type?: string;
  card_color?: string | null;
  card_cost?: string | null;
  card_power?: string | null;
  counter_amount?: number | null;
  attribute?: string | null;
  sub_types?: string | null;
  card_text?: string | null;
  market_price?: number | null;
  card_image?: string;
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(BASE + path, { headers: { Accept: 'application/json' }, signal: controller.signal });
    } catch (err) {
      if (signal?.aborted) throw err; // caller cancelled
      throw new TcgError('network', 'TCG request failed or timed out');
    }
    if (res.status === 429) throw new TcgError('rate-limit', 'TCG rate limit (HTTP 429)');
    if (!res.ok) throw new TcgError('server', `TCG HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Cache-first with TTL; on network failure, replay any stale cached value. */
async function cachedFetch<T>(key: string, maxAgeMs: number, fetcher: () => Promise<T>): Promise<T> {
  const fresh = await readCachedWithTTL<T>(key, maxAgeMs);
  if (fresh != null) return fresh;
  try {
    const data = await fetcher();
    void writeCachedWithTTL(key, data);
    return data;
  } catch (err) {
    const stale = await readCachedWithTTL<T>(key, Infinity);
    if (stale != null) return stale;
    throw err;
  }
}

function mapCard(raw: RawCard): TcgCard {
  return {
    id: raw.card_set_id ?? '',
    name: raw.card_name ?? '',
    setId: raw.set_id ?? '',
    setName: raw.set_name ?? '',
    rarity: raw.rarity ?? '',
    type: raw.card_type ?? '',
    color: raw.card_color ?? null,
    cost: raw.card_cost ?? null,
    power: raw.card_power ?? null,
    counter: raw.counter_amount ?? null,
    attribute: raw.attribute ?? null,
    subTypes: raw.sub_types ?? null,
    text: raw.card_text ?? null,
    marketPrice: typeof raw.market_price === 'number' ? raw.market_price : null,
    image: raw.card_image ?? '',
  };
}

/** Booster sets first (newest-ish order from the API), then starter decks. */
export async function listSets(signal?: AbortSignal): Promise<TcgSet[]> {
  const [sets, decks] = await Promise.all([
    cachedFetch<{ set_id?: string; set_name?: string }[]>('tcg:sets', SETS_TTL, () =>
      fetchJson('/api/allSets/', signal),
    ),
    cachedFetch<{ structure_deck_id?: string; structure_deck_name?: string }[]>('tcg:decks', SETS_TTL, () =>
      fetchJson('/api/allDecks/', signal),
    ),
  ]);
  return [
    ...sets.map((s) => ({ id: s.set_id ?? '', name: s.set_name ?? '', kind: 'set' as const })),
    ...decks.map((d) => ({
      id: d.structure_deck_id ?? '',
      name: d.structure_deck_name ?? '',
      kind: 'deck' as const,
    })),
  ].filter((s) => s.id.length > 0);
}

/** All cards for one set/deck. setKind routes to the correct endpoint. */
export async function listCards(
  setId: string,
  setKind: 'set' | 'deck',
  signal?: AbortSignal,
): Promise<TcgCard[]> {
  const path = setKind === 'deck' ? `/api/decks/${setId}/` : `/api/sets/${setId}/`;
  const raw = await cachedFetch<RawCard[]>(`tcg:cards:${setId}`, CARDS_TTL, () => fetchJson(path, signal));
  return raw.map(mapCard);
}

/**
 * Single card by id (e.g. "OP01-077"). There is no per-card endpoint, so the
 * set is derived from the id prefix and the card is found within the set list.
 * Screens normally navigate with the full card object; this exists for the
 * documented client surface and deep-link/refresh use.
 */
export async function getCard(id: string, signal?: AbortSignal): Promise<TcgCard | null> {
  const m = id.match(/^([A-Za-z]+?)(\d+)-/);
  if (!m) return null;
  const prefix = m[1].toUpperCase();
  const setId = `${prefix}-${m[2]}`; // OP01-077 → OP-01, ST01-016 → ST-01
  const kind = prefix === 'ST' ? 'deck' : 'set';
  const cards = await listCards(setId, kind, signal);
  return cards.find((c) => c.id === id) ?? null;
}

/** Direct image URL for a card (already a full URL from the API). */
export function imageUrl(card: TcgCard): string {
  return card.image;
}

/** USD market price, or an em dash when unavailable. */
export function formatPrice(n: number | null): string {
  return n == null ? '—' : `$${n.toFixed(2)}`;
}
