import type { Language } from '../i18n/i18n';

/**
 * Famous manga titles for the rotating search-hint examples, localized per
 * language. Display-only (not used for actual search). Avoids glyphs Paperlogy
 * lacks (★ ！ 。 、 （ ）).
 */
interface FamousTitle {
  en: string;
  ko: string;
  ja: string;
}

const FAMOUS_MANGA: FamousTitle[] = [
  { en: 'One Piece', ko: '원피스', ja: 'ONE PIECE' },
  { en: 'Naruto', ko: '나루토', ja: 'NARUTO' },
  { en: 'Bleach', ko: '블리치', ja: 'BLEACH' },
  { en: 'Chainsaw Man', ko: '체인소맨', ja: 'チェンソーマン' },
  { en: 'Jujutsu Kaisen', ko: '주술회전', ja: '呪術廻戦' },
  { en: 'Demon Slayer', ko: '귀멸의 칼날', ja: '鬼滅の刃' },
  { en: 'Attack on Titan', ko: '진격의 거인', ja: '進撃の巨人' },
  { en: 'My Hero Academia', ko: '나의 히어로 아카데미아', ja: '僕のヒーローアカデミア' },
  { en: 'Hunter x Hunter', ko: '헌터×헌터', ja: 'HUNTER×HUNTER' },
  { en: 'Dragon Ball', ko: '드래곤볼', ja: 'DRAGON BALL' },
  { en: 'Slam Dunk', ko: '슬램덩크', ja: 'SLAM DUNK' },
  { en: 'Death Note', ko: '데스노트', ja: 'DEATH NOTE' },
  { en: 'Fullmetal Alchemist', ko: '강철의 연금술사', ja: '鋼の錬金術師' },
  { en: 'Haikyu!!', ko: '하이큐', ja: 'ハイキュー' },
  { en: 'Spy x Family', ko: '스파이 패밀리', ja: 'SPY×FAMILY' },
  { en: 'Vinland Saga', ko: '빈란드 사가', ja: 'ヴィンランド・サガ' },
  { en: 'Berserk', ko: '베르세르크', ja: 'ベルセルク' },
  { en: 'Vagabond', ko: '배가본드', ja: 'バガボンド' },
  { en: 'Gintama', ko: '은혼', ja: '銀魂' },
  { en: 'Dr. Stone', ko: '닥터 스톤', ja: 'Dr.STONE' },
  { en: 'Black Clover', ko: '블랙 클로버', ja: 'ブラッククローバー' },
  { en: 'Dandadan', ko: '단다단', ja: 'ダンダダン' },
  { en: 'Sakamoto Days', ko: '사카모토 데이즈', ja: 'SAKAMOTO DAYS' },
  { en: 'Kingdom', ko: '킹덤', ja: 'キングダム' },
];

/** Pick `n` distinct random famous titles, localized to `lang`. */
export function pickRandomFamousTitles(n: number, lang: Language): string[] {
  const pool = [...FAMOUS_MANGA];
  // Fisher–Yates partial shuffle.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((t) => t[lang]);
}
