import type { SavedManga, UserData } from '../user/UserDataContext';

/** When the rating last changed. Falls back to savedAt for legacy entries
 *  written before ratedAt existed, or 0 when there is no rating at all. */
function ratingTime(e: SavedManga): number {
  if (e.ratedAt != null) return e.ratedAt;
  return e.rating != null ? e.savedAt : 0;
}

/**
 * Merge a single manga's two records:
 *  - favorite: UNION (favorited on either side stays favorited)
 *  - rating: from whichever side changed its rating most recently (ratedAt),
 *    so an unrelated favorite toggle can't resurrect a stale rating
 *  - cached fields: from the most recently saved side
 *  - savedAt / ratedAt: the newer of each
 */
function mergeEntry(a: SavedManga, b: SavedManga): SavedManga {
  const ratingWinner = ratingTime(a) >= ratingTime(b) ? a : b;
  const fieldWinner = a.savedAt >= b.savedAt ? a : b;
  return {
    favorite: a.favorite || b.favorite,
    rating: ratingWinner.rating,
    ratedAt: ratingWinner.ratedAt ?? (ratingWinner.rating != null ? ratingWinner.savedAt : null),
    title: fieldWinner.title,
    coverImage: fieldWinner.coverImage,
    genres: fieldWinner.genres,
    tags: fieldWinner.tags,
    savedAt: Math.max(a.savedAt, b.savedAt),
  };
}

/**
 * Merge two user-data stores per manga. Used both for merge-on-sign-in
 * (local guest data ∪ cloud) and reconcile-on-start (local ∪ cloud, newest
 * wins). No pruning here: local mutations already maintain the favorite||rating
 * invariant, so pruning would only risk deleting legitimate cloud-only data.
 */
export function mergeUserData(a: UserData, b: UserData): UserData {
  const out: UserData = { ...a };
  for (const [id, entry] of Object.entries(b)) {
    const existing = out[id];
    out[id] = existing ? mergeEntry(existing, entry) : entry;
  }
  return out;
}
