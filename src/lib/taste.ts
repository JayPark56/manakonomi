import type { Manga, RecommendationsResult } from '../api/anilist';
import { DEMOGRAPHIC_LABELS, TAG_LABELS } from '../i18n/i18n';
import type { UserData } from '../user/UserDataContext';

function isReasonableTag(name: string): boolean {
  return TAG_LABELS[name] !== undefined || DEMOGRAPHIC_LABELS[name] !== undefined;
}

/* ------------------------------------------------------------------ */
/* Multi-select pooling (Part 1.7 I)                                   */
/* ------------------------------------------------------------------ */

export interface PooledCandidate {
  manga: Manga;
  /** Source manga ids that recommended this candidate. */
  recommendedBy: number[];
  score: number;
}

/** Shared genre/tag count between the selected set and one candidate. */
function setOverlap(sources: Manga[], candidate: Manga): number {
  let score = 0;
  const candidateTagNames = new Set(candidate.tags.map((t) => t.name));
  for (const source of sources) {
    for (const genre of source.genres) {
      if (candidate.genres.includes(genre)) score += 3;
    }
    for (const tag of source.tags) {
      if (isReasonableTag(tag.name) && candidateTagNames.has(tag.name)) score += 1;
    }
  }
  return score;
}

/**
 * Pool per-source recommendation lists into one ranked candidate list.
 * Being recommended by more of the selected sources dominates the score;
 * genre/tag overlap with the selected set breaks ties.
 */
export function poolCandidates(results: RecommendationsResult[]): PooledCandidate[] {
  const sourceIds = new Set(results.map((r) => r.source.id));
  const sources = results.map((r) => r.source);
  const pooled = new Map<number, { manga: Manga; recommendedBy: number[] }>();

  for (const result of results) {
    for (const rec of result.recommendations) {
      if (sourceIds.has(rec.id)) continue;
      const existing = pooled.get(rec.id);
      if (existing) {
        existing.recommendedBy.push(result.source.id);
      } else {
        pooled.set(rec.id, { manga: rec, recommendedBy: [result.source.id] });
      }
    }
  }

  // Single source: keep AniList's fan-vote (RATING_DESC) order untouched —
  // the overlap tiebreak is only meaningful when pooling several sources.
  return [...pooled.values()]
    .map((c) => ({
      ...c,
      score:
        c.recommendedBy.length * 1000 +
        (results.length > 1 ? setOverlap(sources, c.manga) : 0),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Pseudo-manga representing the shared taste of a selected set: strictly the
 * intersection of genres/tags. No union fallback — "Matches both: X" must
 * only ever name things the picks actually share (formatReason falls back to
 * a generic line when nothing survives).
 */
export function sharedTasteOf(sources: Manga[]): Manga {
  const [first, ...rest] = sources;
  const genres = first.genres.filter((g) => rest.every((s) => s.genres.includes(g)));
  const tags = first.tags.filter((t) => rest.every((s) => s.tags.some((st) => st.name === t.name)));
  return { ...first, id: -1, genres, tags };
}

/* ------------------------------------------------------------------ */
/* Taste profile from ratings (Parts 1.6/1.7 J-K)                      */
/* ------------------------------------------------------------------ */

export type TasteProfile = Map<string, number>;

/**
 * Genre/tag weights from manga rated >= 4; each contributes its rating
 * (4.5-star manga add 4.5 per genre/tag). Lower ratings are ignored.
 */
export function buildTasteProfile(data: UserData): TasteProfile {
  const profile: TasteProfile = new Map();
  for (const entry of Object.values(data)) {
    if (entry.rating == null || entry.rating < 4) continue;
    const weight = entry.rating;
    for (const genre of entry.genres) {
      profile.set(genre, (profile.get(genre) ?? 0) + weight);
    }
    for (const tag of entry.tags) {
      if (!isReasonableTag(tag.name)) continue;
      profile.set(tag.name, (profile.get(tag.name) ?? 0) + weight);
    }
  }
  return profile;
}

export function scoreByProfile(profile: TasteProfile, manga: Manga): number {
  let score = 0;
  for (const genre of manga.genres) score += profile.get(genre) ?? 0;
  for (const tag of manga.tags) score += profile.get(tag.name) ?? 0;
  return score;
}

/** Top shared names between profile and manga, for "matches your taste" reasons. */
export function profileMatchNames(profile: TasteProfile, manga: Manga, max = 2): string[] {
  const hits: Array<{ name: string; weight: number }> = [];
  for (const genre of manga.genres) {
    const w = profile.get(genre);
    if (w !== undefined) hits.push({ name: genre, weight: w });
  }
  for (const tag of manga.tags) {
    const w = profile.get(tag.name);
    if (w !== undefined) hits.push({ name: tag.name, weight: w });
  }
  return hits
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max)
    .map((h) => h.name);
}
