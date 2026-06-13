import type { Manga } from '../api/anilist';
import { KO_ALIASES_GENERATED } from './koAliasesGenerated';

/**
 * Korean title aliases. Used two ways:
 *  - search: a Korean query matching `aliases` is rewritten to `canonical`
 *    before hitting AniList (which has patchy Korean synonym coverage)
 *  - display: a manga whose English/romaji title matches `canonical` shows
 *    `koDisplay` as its title in Korean mode
 * Add new entries freely; aliases are matched with whitespace removed.
 */
export interface KoAlias {
  /** Korean search inputs (whitespace-insensitive). */
  aliases: string[];
  /** Canonical English/Japanese title sent to AniList search. */
  canonical: string;
  /** Korean display title. */
  koDisplay: string;
  /**
   * Extra English/romaji titles that identify the SAME work for display
   * matching (exact match only — never prefixes, so spinoffs like
   * "Chainsaw Man: Buddy Stories" don't inherit the main title).
   */
  latinAliases?: string[];
}

/**
 * Hand-curated entries. These take precedence over the CSV-generated bulk
 * (search: matched first; display: applied last so they win key collisions),
 * preserving careful tweaks like the Kimetsu-no-Yaiba canonical and the
 * Chainsaw Man spinoff display fix.
 */
const CURATED_KO_ALIASES: KoAlias[] = [
  { aliases: ['원피스'], canonical: 'One Piece', koDisplay: '원피스' },
  { aliases: ['은혼'], canonical: 'Gintama', koDisplay: '은혼', latinAliases: ['Gin Tama'] },
  {
    aliases: ['헌터헌터', '헌터x헌터', '헌터×헌터'],
    canonical: 'Hunter x Hunter',
    koDisplay: '헌터×헌터',
    latinAliases: ['Hunter×Hunter'],
  },
  {
    aliases: ['유유백서'],
    canonical: 'Yu Yu Hakusho',
    koDisplay: '유유백서',
    latinAliases: ['Yuu Yuu Hakusho', 'Yuu☆Yuu☆Hakusho'],
  },
  { aliases: ['킹덤'], canonical: 'Kingdom', koDisplay: '킹덤' },
  { aliases: ['사카모토데이즈'], canonical: 'Sakamoto Days', koDisplay: '사카모토 데이즈' },
  {
    aliases: ['나의히어로아카데미아', '히로아카'],
    canonical: 'My Hero Academia',
    koDisplay: '나의 히어로 아카데미아',
    latinAliases: ['Boku no Hero Academia'],
  },
  { aliases: ['하이큐'], canonical: 'Haikyu', koDisplay: '하이큐!!', latinAliases: ['Haikyuu!!', 'Haikyu!!'] },
  { aliases: ['주술회전'], canonical: 'Jujutsu Kaisen', koDisplay: '주술회전' },
  { aliases: ['체인소맨', '체인쏘맨'], canonical: 'Chainsaw Man', koDisplay: '체인소 맨' },
  { aliases: ['단다단'], canonical: 'Dandadan', koDisplay: '단다단' },
  {
    aliases: ['진격의거인'],
    canonical: 'Attack on Titan',
    koDisplay: '진격의 거인',
    latinAliases: ['Shingeki no Kyojin'],
  },
  { aliases: ['나루토'], canonical: 'Naruto', koDisplay: '나루토' },
  { aliases: ['블리치'], canonical: 'Bleach', koDisplay: '블리치' },
  {
    // Canonical is the romaji title: searching "Demon Slayer" on AniList
    // ranks an unrelated demon manga above Kimetsu no Yaiba.
    aliases: ['귀멸의칼날'],
    canonical: 'Kimetsu no Yaiba',
    koDisplay: '귀멸의 칼날',
    latinAliases: ['Demon Slayer', 'Demon Slayer: Kimetsu no Yaiba'],
  },
  { aliases: ['슬램덩크'], canonical: 'Slam Dunk', koDisplay: '슬램덩크' },
];

/** Curated first so findKoAlias() resolves curated entries ahead of generated. */
export const KO_ALIASES: KoAlias[] = [...CURATED_KO_ALIASES, ...KO_ALIASES_GENERATED];

/** Whitespace-insensitive, case-insensitive form for Korean alias matching. */
function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/\s+/g, '');
}

export function findKoAlias(query: string): KoAlias | null {
  const normalized = normalizeQuery(query);
  return KO_ALIASES.find((entry) => entry.aliases.some((a) => normalizeQuery(a) === normalized)) ?? null;
}

/** Latin-title form for canonical matching: lowercase alphanumerics only. */
function normalizeLatin(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Generated first, curated last: on a latin-key collision the curated koDisplay
// wins (Map keeps the last value written for a key).
const KO_DISPLAY_BY_LATIN = new Map(
  [...KO_ALIASES_GENERATED, ...CURATED_KO_ALIASES].flatMap((entry) =>
    [entry.canonical, ...(entry.latinAliases ?? [])].map(
      (title) => [normalizeLatin(title), entry.koDisplay] as const,
    ),
  ),
);

/**
 * Korean display title for a manga, if its English or romaji title exactly
 * matches a known canonical title or latin alias.
 */
export function koDisplayTitleFor(manga: Manga): string | null {
  const { english, romaji } = manga.title;
  for (const raw of [english, romaji]) {
    if (!raw) continue;
    const hit = KO_DISPLAY_BY_LATIN.get(normalizeLatin(raw));
    if (hit) return hit;
  }
  return null;
}
