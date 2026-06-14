/**
 * Union Arena (Hunter x Hunter) client.
 *
 * Source: apitcg's open data repo (keyless) — the hosted apitcg.com API needs an
 * x-api-key, but the raw GitHub JSON is a single static array of all cards with
 * working image URLs (hosted on unionarena-tcg.com). There is NO price data.
 *   cards/en/general.json → ~541 cards across IPs; we keep set.name "HUNTER X HUNTER".
 */
import { readCachedWithTTL, writeCachedWithTTL } from '../api/cache';
import { TcgError, tcgErrorKind } from './optcgApi';

const SOURCE_URL =
  'https://raw.githubusercontent.com/apitcg/union-arena-tcg-data/main/cards/en/general.json';
const HXH_SET = 'HUNTER X HUNTER';
const TIMEOUT_MS = 15000;
const CARDS_TTL = 1000 * 60 * 60 * 24 * 30; // static card data → 30 days

export interface UnionArenaCard {
  /** Unique per printing (code + image), used for keys + the collection store.
   *  Distinct from `code` because alt-art printings share a card number. */
  id: string;
  code: string; // displayed card number, e.g. "HTR-1-005"
  name: string;
  rarity: string; // C / U / R / SR / UR (+ ★ alt-art variants)
  type: string; // Character / Event / Site
  ap: string;
  bp: string;
  affinity: string;
  effect: string;
  trigger: string;
  image: string; // images.large
  setName: string; // "HUNTER X HUNTER"
}

interface RawUaCard {
  code?: string;
  name?: string;
  rarity?: string;
  type?: string;
  ap?: string;
  bp?: string;
  affinity?: string;
  effect?: string;
  trigger?: string;
  images?: { small?: string; large?: string };
  set?: { name?: string };
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    } catch (err) {
      if (signal?.aborted) throw err;
      throw new TcgError('network', 'Union Arena request failed or timed out');
    }
    if (res.status === 429) throw new TcgError('rate-limit', 'Union Arena rate limit (HTTP 429)');
    if (!res.ok) throw new TcgError('server', `Union Arena HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Cache-first with TTL; on network failure, replay any stale cached value. */
async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const fresh = await readCachedWithTTL<T>(key, CARDS_TTL);
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

/** The data uses the literal "-" as a no-value placeholder; treat it as empty. */
function cleanText(s: string | undefined): string {
  const t = (s ?? '').trim();
  return t === '-' ? '' : (s ?? '');
}

function mapCard(raw: RawUaCard): UnionArenaCard {
  const code = raw.code ?? '';
  const image = raw.images?.large ?? raw.images?.small ?? '';
  // Alt-art printings reuse a card number, so the code alone isn't unique;
  // the image filename distinguishes printings.
  const imageId = image.split('/').pop() ?? '';
  return {
    id: imageId ? `${code}#${imageId}` : code,
    code,
    name: raw.name ?? '',
    rarity: raw.rarity ?? '',
    type: raw.type ?? '',
    ap: raw.ap ?? '',
    bp: raw.bp ?? '',
    affinity: raw.affinity ?? '',
    effect: cleanText(raw.effect),
    trigger: cleanText(raw.trigger),
    image,
    setName: raw.set?.name ?? '',
  };
}

/**
 * Hunter x Hunter cards only. Drops generic/sealed entries (no image, or empty
 * rarity/type — e.g. the generic Action Point cards). Cached hard (static data).
 */
export async function listHxHCards(signal?: AbortSignal): Promise<UnionArenaCard[]> {
  const raw = await cachedFetch<RawUaCard[]>('ua:cards:hxh', () => fetchJson(SOURCE_URL, signal));
  return raw
    .filter(
      (c) =>
        c.set?.name === HXH_SET &&
        !!(c.images?.large ?? c.images?.small) &&
        !!c.rarity &&
        !!c.type,
    )
    .map(mapCard);
}

/** Re-export so screens can localize/classify errors like the One Piece client. */
export { tcgErrorKind } from './optcgApi';
export type { TcgErrorKind } from './optcgApi';

const RARITY_BASE: Record<string, number> = { UR: 5, SR: 4, R: 3, U: 2, C: 1 };

/** Rank for UR>SR>R>U>C, with ★ alt-art variants ordered above their base. */
export function rarityRank(rarity: string): number {
  const base = rarity.replace(/★/g, '').trim();
  const stars = (rarity.match(/★/g) ?? []).length;
  return (RARITY_BASE[base] ?? 0) * 10 + stars;
}

export type UaSortMode = 'default' | 'rarity';

export function sortCards(cards: UnionArenaCard[], mode: UaSortMode): UnionArenaCard[] {
  if (mode !== 'rarity') return cards;
  return [...cards].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
}
