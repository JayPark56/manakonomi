import type { Manga } from '../api/anilist';
import type { Language } from '../i18n/i18n';
import { koDisplayTitleFor } from '../data/koAliases';

/**
 * Title in the selected language:
 *  - en: English, fallback romaji
 *  - ja: native (Japanese), fallback romaji
 *  - ko: Korean alias-map title if known, fallback romaji
 */
export function displayTitle(manga: Manga, lang: Language): string | null {
  const { english, romaji, native } = manga.title;
  switch (lang) {
    case 'en':
      return english ?? romaji;
    case 'ja':
      return native ?? romaji;
    case 'ko':
      return koDisplayTitleFor(manga) ?? romaji;
  }
}

/** Romaji secondary line in en/ko modes (ja shows the native title alone). */
export function secondaryTitle(manga: Manga, lang: Language): string | null {
  if (lang === 'ja') return null;
  const primary = displayTitle(manga, lang);
  const romaji = manga.title.romaji;
  return romaji != null && romaji !== primary ? romaji : null;
}
