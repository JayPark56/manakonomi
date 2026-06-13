export type QueryScript = 'hangul' | 'japanese' | 'latin' | 'other';

/**
 * Dominant script of a search query. Kanji counts as Japanese — for manga
 * titles a CJK-ideograph query is overwhelmingly a Japanese title.
 */
export function detectScript(query: string): QueryScript {
  let hangul = 0;
  let japanese = 0;
  let latin = 0;
  let total = 0;
  for (const ch of query) {
    if (/\s/.test(ch)) continue;
    const cp = ch.codePointAt(0)!;
    total++;
    if ((cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f)) {
      hangul++; // Hangul syllables + jamo
    } else if (
      (cp >= 0x3040 && cp <= 0x30ff) || // hiragana + katakana
      (cp >= 0x31f0 && cp <= 0x31ff) || // katakana extensions
      cp === 0x30fc ||                  // long-vowel mark
      (cp >= 0x4e00 && cp <= 0x9fff)    // CJK ideographs
    ) {
      japanese++;
    } else if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) {
      latin++;
    }
  }
  if (total === 0) return 'other';
  if (hangul > 0 && hangul >= japanese && hangul >= latin) return 'hangul';
  if (japanese > 0 && japanese >= latin) return 'japanese';
  if (latin > 0) return 'latin';
  return 'other';
}
