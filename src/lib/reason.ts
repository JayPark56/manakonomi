import type { Manga } from '../api/anilist';
import {
  DEMOGRAPHIC_LABELS,
  GENRE_LABELS,
  TAG_LABELS,
  formatReasonLine,
  reasonLabel,
  t,
  type Language,
  type ReasonConnector,
} from '../i18n/i18n';

/**
 * Structured "why this recommendation" tokens. All values are canonical
 * AniList names; localization happens at render time via i18n labels.
 */
export interface ReasonTokens {
  /** Shared demographic tag (Shounen/Seinen/...), if any. */
  demographic: string | null;
  /** Shared genres, in the source manga's genre order. */
  genres: string[];
  /** Shared themed tags (allowlisted), by combined rank descending. */
  tags: string[];
}

export function buildReasonTokens(source: Manga, rec: Manga): ReasonTokens {
  const recTagRanks = new Map(rec.tags.map((tag) => [tag.name, tag.rank ?? 0]));
  const sharedTags = source.tags
    .filter(
      (tag) =>
        (TAG_LABELS[tag.name] !== undefined || DEMOGRAPHIC_LABELS[tag.name] !== undefined) &&
        recTagRanks.has(tag.name),
    )
    .map((tag) => ({
      name: tag.name,
      score: (tag.rank ?? 0) + (recTagRanks.get(tag.name) ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    demographic: sharedTags.find((tag) => DEMOGRAPHIC_LABELS[tag.name] !== undefined)?.name ?? null,
    genres: source.genres.filter((g) => rec.genres.includes(g)),
    tags: sharedTags
      .filter((tag) => DEMOGRAPHIC_LABELS[tag.name] === undefined)
      .map((tag) => tag.name),
  };
}

/** Top 1-2 canonical names: demographic → genres → themed tags. */
export function pickReasonNames(tokens: ReasonTokens, max = 2): string[] {
  const names: string[] = [];
  if (tokens.demographic) names.push(tokens.demographic);
  for (const genre of tokens.genres) {
    if (names.length >= max) break;
    names.push(genre);
  }
  for (const tag of tokens.tags) {
    if (names.length >= max) break;
    if (!names.includes(tag)) names.push(tag);
  }
  return names.slice(0, max);
}

/**
 * One-line localized reason, e.g.
 * en "Both are shounen + action" / ko "둘 다 소년 + 액션" /
 * ja "どちらも 少年 + アクション".
 */
export function formatReason(
  tokens: ReasonTokens,
  lang: Language,
  connector: ReasonConnector = 'both',
): string {
  const names = pickReasonNames(tokens);
  if (names.length === 0) return t('reasonFallback', lang);
  // English: bare-noun tag labels break the copular "Both are X" frame
  // ("Both are food"), so themed tags switch to "Both feature X".
  const hasThemedTag = names.some(
    (name) =>
      TAG_LABELS[name] !== undefined &&
      DEMOGRAPHIC_LABELS[name] === undefined &&
      GENRE_LABELS[name] === undefined,
  );
  const effective = connector === 'both' && hasThemedTag ? 'bothFeature' : connector;
  return formatReasonLine(effective, names.map((name) => reasonLabel(name, lang)), lang);
}
