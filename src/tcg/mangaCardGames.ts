import type { Manga } from '../api/anilist';

/**
 * Maps a manga to a linked trading-card game. Phase 3.0 links ONLY the main
 * One Piece series to the One Piece Card Game — detected by AniList id and an
 * exact title match so spinoffs (One Piece Party, One Piece School, Wan Piece,
 * Ace's Story, …) are never linked.
 */
export type CardGame = 'optcg';

/** AniList manga id for the main One Piece series. */
const ONE_PIECE_IDS = new Set<number>([30013]);

export function cardGameFor(manga: Manga): CardGame | null {
  if (ONE_PIECE_IDS.has(manga.id)) return 'optcg';
  const titles = [manga.title.english, manga.title.romaji]
    .filter((t): t is string => !!t)
    .map((t) => t.trim().toLowerCase());
  // Exact match only — "one piece party"/"one piece school" must not qualify.
  if (titles.includes('one piece')) return 'optcg';
  return null;
}

/** True if any of the given manga link to a card game. */
export function anyCardGame(sources: Manga[]): boolean {
  return sources.some((m) => cardGameFor(m) != null);
}
