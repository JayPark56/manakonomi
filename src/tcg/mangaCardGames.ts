import type { Manga } from '../api/anilist';

/**
 * Maps a manga to a linked trading-card game:
 *  - One Piece (main series) → One Piece Card Game ('optcg', via optcgapi)
 *  - Hunter x Hunter (main series) → Union Arena ('union-arena', HxH cards)
 * Detected by AniList id + an exact title match so spinoffs are never linked
 * (One Piece Party/School/Wan Piece, HxH: Kurapika's Memories, …).
 */
export type CardGame = 'optcg' | 'union-arena';

/** AniList manga ids for the main series. */
const ONE_PIECE_IDS = new Set<number>([30013]);
const HUNTER_X_HUNTER_IDS = new Set<number>([30026]);

function titlesOf(manga: Manga): string[] {
  return [manga.title.english, manga.title.romaji]
    .filter((t): t is string => !!t)
    .map((t) => t.trim().toLowerCase());
}

export function cardGameFor(manga: Manga): CardGame | null {
  const titles = titlesOf(manga);
  if (ONE_PIECE_IDS.has(manga.id) || titles.includes('one piece')) return 'optcg';
  // Accept both "hunter x hunter" and the "hunter×hunter" romaji form.
  if (
    HUNTER_X_HUNTER_IDS.has(manga.id) ||
    titles.includes('hunter x hunter') ||
    titles.includes('hunter×hunter')
  ) {
    return 'union-arena';
  }
  return null;
}

/** The card game linked to any of the given sources (first match), or null. */
export function cardGameForSources(sources: Manga[]): CardGame | null {
  for (const m of sources) {
    const game = cardGameFor(m);
    if (game) return game;
  }
  return null;
}
