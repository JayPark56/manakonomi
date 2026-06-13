/**
 * AniList public GraphQL API client (no API key required).
 * https://graphql.anilist.co
 */
import { apiCacheKey, readApiCache, writeApiCache } from './cache';

const ENDPOINT = 'https://graphql.anilist.co';

export interface MangaTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface MangaTag {
  name: string;
  rank: number | null;
}

export interface Manga {
  id: number;
  title: MangaTitle;
  coverImage: { extraLarge: string | null; large: string | null };
  genres: string[];
  tags: MangaTag[];
}

interface RawMedia extends Manga {
  type: 'ANIME' | 'MANGA';
  isAdult: boolean;
}

export type AniListErrorKind = 'rate-limit' | 'network' | 'server';

export class AniListError extends Error {
  kind: AniListErrorKind;

  constructor(kind: AniListErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const TIMEOUT_MS = 15000;

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const cacheKey = apiCacheKey(query, variables);
  // Internal controller so a stalled connection times out even when the
  // caller never aborts (e.g. user just stares at the spinner).
  const controller = new AbortController();
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
    } catch (err) {
      if (signal?.aborted) throw err; // caller cancelled — screens ignore this
      // Offline / timeout: replay the last successful response if we have one
      // (the service worker can't cache these POST requests).
      const cached = await readApiCache<T>(cacheKey);
      if (cached != null) return cached;
      throw new AniListError('network', 'AniList request failed or timed out');
    }
    if (res.status === 429) {
      throw new AniListError('rate-limit', 'AniList rate limit hit (HTTP 429)');
    }
    if (!res.ok) {
      throw new AniListError('server', `AniList HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json.errors?.length) {
      throw new AniListError('server', json.errors[0]?.message ?? 'AniList GraphQL error');
    }
    const data = json.data as T;
    void writeApiCache(cacheKey, data); // fire-and-forget; powers offline replay
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

/** Classifies a failed AniList call so the UI can localize the message. */
export function errorKindOf(err: unknown): AniListErrorKind {
  return err instanceof AniListError ? err.kind : 'server';
}

const MEDIA_FIELDS = `
  id
  type
  isAdult
  title { romaji english native }
  coverImage { extraLarge large }
  genres
  tags { name rank }
`;

const SEARCH_QUERY = `
  query SearchManga($q: String) {
    Page(perPage: 10) {
      media(search: $q, type: MANGA) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function searchManga(q: string, signal?: AbortSignal): Promise<Manga[]> {
  const data = await gql<{ Page: { media: RawMedia[] } }>(SEARCH_QUERY, { q }, signal);
  const results = (data.Page.media ?? []).filter((m) => m && !m.isAdult);
  console.log(`[AniList] search "${q}" → ${results.length} results`);
  return results;
}

const RECOMMENDATIONS_QUERY = `
  query MangaRecommendations($id: Int) {
    Media(id: $id, type: MANGA) {
      ${MEDIA_FIELDS}
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes {
          rating
          mediaRecommendation {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  }
`;

export interface RecommendationsResult {
  source: Manga;
  recommendations: Manga[];
}

export async function fetchRecommendations(
  id: number,
  signal?: AbortSignal,
  limit = 5,
): Promise<RecommendationsResult> {
  const data = await gql<{
    Media: RawMedia & {
      recommendations: { nodes: Array<{ rating: number; mediaRecommendation: RawMedia | null }> };
    };
  }>(RECOMMENDATIONS_QUERY, { id }, signal);

  const source = data.Media;
  const seen = new Set<number>([source.id]);
  const recommendations: Manga[] = [];
  for (const node of source.recommendations?.nodes ?? []) {
    const rec = node?.mediaRecommendation;
    // (node.rating ?? 0) < 0 drops recommendations the community net-downvoted.
    if (!rec || (node.rating ?? 0) < 0 || rec.type !== 'MANGA' || rec.isAdult || seen.has(rec.id)) continue;
    seen.add(rec.id);
    recommendations.push(rec);
    if (recommendations.length >= limit) break;
  }
  console.log(
    `[AniList] recommendations for #${id} (${source.title.romaji}) → ${recommendations.length} manga`,
  );
  return { source, recommendations };
}
