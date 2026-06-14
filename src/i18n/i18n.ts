/**
 * All user-facing strings in en/ko/ja, plus the canonical-name → localized
 * label tables for AniList genres, demographics, and themed tags.
 */

export type Language = 'en' | 'ko' | 'ja';

export const LANGUAGES: Language[] = ['en', 'ko', 'ja'];

type Localized = Record<Language, string>;

const STRINGS = {
  appTitle: {
    en: 'Manakonomi',
    ko: '마나코노미',
    ja: 'マナコノミ',
  },
  // Brand subtitle shown on the splash + onboarding screens.
  splashSubtitle: {
    en: 'We uncover the hidden manga tastes you never knew you had.',
    ko: '당신도 몰랐던, 숨겨진 만화 취향들을 찾아드립니다.',
    ja: 'まだ気づいていない隠れたマンガの好みを見つけます',
  },
  onboardingGoogle: {
    en: 'Sign in with Google',
    ko: 'Google로 로그인',
    ja: 'Googleでログイン',
  },
  onboardingGuest: {
    en: 'Continue as guest',
    ko: '게스트로 시작',
    ja: 'ゲストで始める',
  },
  // Shown to guests (onboarding + Library) — signing in later syncs data.
  guestSyncNote: {
    en: 'Sign in to sync your ratings and favorites across all your devices.',
    ko: '로그인하면 모든 기기에서 별점과 즐겨찾기가 이어져요.',
    ja: 'ログインすれば、評価とお気に入りがすべての端末で同期されます。',
  },
  // The tappable span within guestSyncNote (must be a verbatim substring of it).
  guestSyncNoteLink: {
    en: 'Sign in',
    ko: '로그인',
    ja: 'ログイン',
  },
  signInError: {
    en: "Couldn't sign in. Please try again.",
    ko: '로그인하지 못했어요. 다시 시도해 주세요.',
    ja: 'ログインできませんでした もう一度お試しください',
  },
  signOut: {
    en: 'Sign out',
    ko: '로그아웃',
    ja: 'ログアウト',
  },
  syncOn: {
    en: 'Synced with Google',
    ko: 'Google로 동기화 중',
    ja: 'Googleと同期中',
  },
  subtitle: {
    en: 'Find manga similar to ones you loved',
    ko: '재미있게 읽은 만화와 비슷한 작품을 찾아드려요',
    ja: '好きなマンガに似た作品を見つけよう',
  },
  searchPlaceholder: {
    en: 'Search manga titles',
    ko: '만화 제목을 검색하세요',
    ja: 'マンガのタイトルを検索',
  },
  searchHint: {
    en: 'Try: One Piece, Chainsaw Man, Berserk',
    ko: '예: 원피스, 체인소맨, 슬램덩크',
    ja: '例: ワンピース・チェンソーマン・ベルセルク',
  },
  // Prefix for the rotating example titles, e.g. "e.g. A, B, C".
  searchHintPrefix: { en: 'e.g.', ko: '예:', ja: '例:' },
  emptySearch: {
    en: 'No results\nTry the English or Japanese title',
    ko: '검색 결과가 없어요\n영어나 일본어 제목으로도 검색해 보세요',
    ja: '結果が見つかりません\n英語タイトルでも試してみてください',
  },
  errRateLimit: {
    en: 'Too many requests\nPlease try again in a moment',
    ko: '요청이 너무 많았어요\n잠시 후 다시 시도해 주세요',
    ja: 'リクエストが多すぎます\n少し待ってからもう一度お試しください',
  },
  errNetwork: {
    en: 'Check your network connection',
    ko: '네트워크 연결을 확인해 주세요',
    ja: 'ネットワーク接続を確認してください',
  },
  errServer: {
    en: 'AniList is having trouble\nPlease try again',
    ko: 'AniList에 잠시 문제가 있어요\n다시 시도해 주세요',
    ja: 'AniListに問題が発生しています\nもう一度お試しください',
  },
  back: { en: 'Back', ko: '뒤로', ja: '戻る' },
  retry: { en: 'Try again', ko: '다시 시도', ja: '再試行' },
  similarTo: {
    en: 'Similar to',
    ko: '이 작품과 비슷한 만화',
    ja: 'この作品に似たマンガ',
  },
  similarToPicks: {
    en: 'Similar to your picks',
    ko: '선택한 작품들과 비슷한 만화',
    ja: '選んだ作品に似たマンガ',
  },
  noRecs: {
    en: 'No recommendations for this one yet',
    ko: '이 작품에 대한 추천이 아직 없어요',
    ja: 'この作品のおすすめはまだありません',
  },
  noTitle: { en: 'Untitled', ko: '제목 없음', ja: 'タイトルなし' },
  tabSearch: { en: 'Search', ko: '검색', ja: '検索' },
  tabLibrary: { en: 'Library', ko: '보관함', ja: 'ライブラリ' },
  tabForYou: { en: 'For You', ko: '추천', ja: 'おすすめ' },
  secFansAlsoLike: {
    en: 'Fans also like',
    ko: '팬들이 함께 좋아한 작품',
    ja: 'ファンのおすすめ',
  },
  secBasedOnRatings: {
    en: 'Based on your ratings',
    ko: '내 별점 기반 추천',
    ja: '評価にもとづくおすすめ',
  },
  ratingsNote: {
    en: 'Rate some manga to personalize this — default order for now',
    ko: '별점을 매기면 맞춤 정렬이 돼요. 지금은 기본 순서예요',
    ja: '評価するとカスタマイズされます\n今は標準の順番です',
  },
  libFavorites: { en: 'Favorites', ko: '즐겨찾기', ja: 'お気に入り' },
  libRated: { en: 'Rated', ko: '별점 매긴 작품', ja: '評価済み' },
  libraryEmpty: {
    en: 'Star or rate manga and they will show up here',
    ko: '별을 누르거나 별점을 매기면 여기에 모여요',
    ja: 'お気に入りや評価した作品がここに表示されます',
  },
  forYouTitle: { en: 'For You', ko: '맞춤 추천', ja: 'あなたへのおすすめ' },
  forYouEmpty: {
    en: 'Rate at least 3 manga 4★ or higher to unlock For You',
    ko: '4점 이상 별점을 3개 이상 매기면 추천이 열려요',
    ja: '4つ星以上の評価を3作品以上つけるとおすすめが表示されます',
  },
  browseMore: {
    en: 'Not seeing your taste? Browse more',
    ko: '취향인 작품이 없으신가요? 다른 작품 찾아보기',
    ja: '好みの作品がない？ 他の作品を探す',
  },
  selectionClear: { en: 'Clear', ko: '지우기', ja: 'クリア' },
  selectionGo: { en: 'Get recommendations', ko: '추천 보기', ja: 'おすすめを見る' },
  reasonFallback: {
    en: 'Recommended together by AniList readers',
    ko: 'AniList 독자들이 함께 추천한 작품',
    ja: 'AniList読者のおすすめ',
  },
  tasteMatchFallback: {
    en: 'Matches your taste',
    ko: '내 취향 저격',
    ja: '好みにマッチ',
  },
  a11yFavorite: { en: 'Favorite', ko: '즐겨찾기', ja: 'お気に入り' },
  a11yRating: { en: 'Rating', ko: '별점', ja: '評価' },
  a11ySelect: { en: 'Select', ko: '선택', ja: '選択' },
  // Library rating filter
  ratingFilterAll: { en: 'All', ko: '전체', ja: 'すべて' },
  ratingThresholdSuffix: { en: '+', ko: ' 이상', ja: '以上' },
  ratedFilterEmpty: {
    en: 'No manga at this rating or higher',
    ko: '이 별점 이상의 작품이 없어요',
    ja: 'この評価以上の作品がありません',
  },
  // Search feedback form
  feedbackOpen: { en: 'Send feedback', ko: '한마디 건네기', ja: 'ひとことを送る' },
  feedbackPrompt: {
    en: "Tell us about manga that won't show up, or any bugs.",
    ko: '검색되지 않는 만화나 버그가 있다면 알려주세요.',
    ja: '検索できない漫画やバグがあれば教えてください',
  },
  feedbackMessagePlaceholder: { en: 'Your message', ko: '내용을 입력하세요', ja: 'メッセージを入力' },
  feedbackNicknamePlaceholder: { en: 'Nickname (optional)', ko: '닉네임 (선택)', ja: 'ニックネーム (任意)' },
  a11yClose: { en: 'Close', ko: '닫기', ja: '閉じる' },
  feedbackSend: { en: 'Send', ko: '보내기', ja: '送信' },
  feedbackSending: { en: 'Sending…', ko: '보내는 중…', ja: '送信中…' },
  feedbackSuccess: {
    en: 'Thanks for your feedback!',
    ko: '보내주셔서 고마워요!',
    ja: 'フィードバックありがとうございます',
  },
  feedbackError: {
    en: "Couldn't send. Please try again.",
    ko: '보내지 못했어요. 다시 시도해 주세요.',
    ja: '送信できませんでした もう一度お試しください',
  },
  feedbackNotReady: { en: 'Coming soon', ko: '준비 중', ja: '準備中' },
  // One Piece TCG browser
  tcgEntry: {
    en: 'View One Piece TCG cards',
    ko: '원피스 카드게임 보기',
    ja: 'ONE PIECEカードを見る',
  },
  tcgTitle: { en: 'One Piece TCG', ko: '원피스 카드게임', ja: 'ONE PIECEカードゲーム' },
  tcgEmpty: { en: 'No cards in this set', ko: '이 세트에 카드가 없어요', ja: 'このセットにカードがありません' },
  tcgMarketPrice: { en: 'Market price', ko: '시세', ja: '相場価格' },
  tcgPriceFrom: { en: 'Prices from TCGPlayer', ko: 'TCGPlayer 시세 기준', ja: '価格はTCGPlayer提供' },
  tcgSetLabel: { en: 'Set', ko: '세트', ja: 'セット' },
  tcgTypeLabel: { en: 'Type', ko: '종류', ja: 'タイプ' },
  tcgRarityLabel: { en: 'Rarity', ko: '레어도', ja: 'レアリティ' },
  tcgSortDefault: { en: 'Default', ko: '기본', ja: '標準' },
  tcgSortPrice: { en: 'Price ↓', ko: '비싼 순', ja: '高い順' },
  tcgViewSet: { en: 'View this set', ko: '이 세트 전체 보기', ja: 'このセットを見る' },
  // Intro / how-to coach cards
  introNext: { en: 'Next', ko: '다음', ja: '次へ' },
  introDone: { en: 'Done', ko: '시작하기', ja: 'はじめる' },
  introSkip: { en: 'Skip', ko: '건너뛰기', ja: 'スキップ' },
  intro1Title: { en: 'Search a manga you loved', ko: '재밌게 본 만화를 검색하세요', ja: '好きな漫画を検索' },
  intro1Desc: {
    en: "Find one you like and we'll surface similar titles.",
    ko: '좋아하는 작품을 검색하면 비슷한 만화를 찾아드려요.',
    ja: '好きな作品を検索すると 似た漫画を見つけます',
  },
  intro2Title: { en: 'Combine your tastes', ko: '여러 취향을 한 번에', ja: '好みをまとめて' },
  intro2Desc: {
    en: 'Use the + button to pick several titles and blend them into one set of recommendations.',
    ko: '+ 버튼으로 여러 작품을 골라 취향을 합쳐서 추천받을 수 있어요.',
    ja: '+ ボタンで複数の作品を選び 好みを合わせておすすめを受け取れます',
  },
  intro3Title: { en: 'Heart vs. rating', ko: '하트와 별점은 달라요', ja: 'ハートと評価の違い' },
  intro3Desc: {
    en: 'The heart saves manga you want to read or are curious about. It does not affect recommendations.',
    ko: '하트는 보고 싶거나 관심 있는 작품을 저장해요. 추천에는 영향을 주지 않아요.',
    ja: 'ハートは気になる・読みたい作品を保存します おすすめには影響しません',
  },
  intro4Title: { en: "Rate what you've read", ko: '별점은 이미 본 작품 평가예요', ja: '評価でおすすめが進化' },
  intro4Desc: {
    en: 'Rate manga you have already read, and that taste shapes your For You tab.',
    ko: "이미 본 작품에 별점을 남기면 그 취향이 '추천' 탭에 반영돼요.",
    ja: '読んだ作品を評価すると その好みが「おすすめ」タブに反映されます',
  },
  intro5Title: { en: 'Sign in to sync', ko: '로그인하면 모든 기기에서', ja: 'ログインで同期' },
  intro5Desc: {
    en: 'Sign in and your ratings and hearts follow you across devices.',
    ko: '로그인하면 별점과 하트가 모든 기기에서 이어져요.',
    ja: 'ログインすれば 評価とハートがすべての端末で同期されます',
  },
  a11yHelp: { en: 'How it works', ko: '사용법', ja: '使い方' },
  // Card collection
  a11yCollect: { en: 'Collect card', ko: '카드 수집', ja: 'カードを集める' },
  cardCollectionEntry: { en: 'My Card Collection', ko: '내 카드 컬렉션', ja: 'マイカードコレクション' },
  cardCollectionTotal: { en: 'Total value:', ko: '총 가치:', ja: '合計:' },
  cardCollectionEmpty: {
    en: 'No cards collected yet. Tap the heart on a card to add it.',
    ko: '아직 모은 카드가 없어요. 카드의 하트를 눌러 담아보세요.',
    ja: 'まだ集めたカードがありません カードのハートを押して追加しましょう',
  },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Language): string {
  return STRINGS[key][lang];
}

/** Localized VoiceOver label for a half-star value, e.g. "별점 2.5점". */
export function a11yRateLabel(value: number, lang: Language): string {
  switch (lang) {
    case 'en':
      return `Rate ${value} stars`;
    case 'ko':
      return `별점 ${value}점`;
    case 'ja':
      return `${value}つ星を付ける`;
  }
}

/* ------------------------------------------------------------------ */
/* Reason connectors                                                    */
/* ------------------------------------------------------------------ */

/** "Both are shounen + action" — single source, demographic/genre labels. */
const REASON_BOTH: Localized = { en: 'Both are', ko: '둘 다', ja: 'どちらも' };
/** "Both feature time loops + survival" — single source when a themed-tag
 *  label fills a slot (bare nouns break the copular "Both are" in English). */
const REASON_BOTH_FEATURE: Localized = { en: 'Both feature', ko: '둘 다', ja: 'どちらも' };
/** 2 selected sources. */
const REASON_MATCHES_BOTH: Localized = { en: 'Matches both:', ko: '두 작품 모두와 잘 맞아요:', ja: 'どちらにも合う:' };
/** 3+ selected sources. */
const REASON_MATCHES_ALL: Localized = { en: 'Matches all:', ko: '선택한 작품 모두와 잘 맞아요:', ja: 'どれにも合う:' };
/** For You taste match. */
const REASON_TASTE: Localized = { en: 'Matches your taste:', ko: '내 취향 저격:', ja: '好みに合う:' };

export type ReasonConnector = 'both' | 'bothFeature' | 'matchesBoth' | 'matchesAll' | 'taste';

const CONNECTORS: Record<ReasonConnector, Localized> = {
  both: REASON_BOTH,
  bothFeature: REASON_BOTH_FEATURE,
  matchesBoth: REASON_MATCHES_BOTH,
  matchesAll: REASON_MATCHES_ALL,
  taste: REASON_TASTE,
};

export function formatReasonLine(
  connector: ReasonConnector,
  labels: string[],
  lang: Language,
): string {
  const joined = labels.join(' + ');
  return `${CONNECTORS[connector][lang]} ${joined}`;
}

/* ------------------------------------------------------------------ */
/* Genre / demographic / tag label tables (keyed by AniList name)       */
/* ------------------------------------------------------------------ */

export const GENRE_LABELS: Record<string, Localized> = {
  Action: { en: 'Action', ko: '액션', ja: 'アクション' },
  Adventure: { en: 'Adventure', ko: '모험', ja: '冒険' },
  Comedy: { en: 'Comedy', ko: '코미디', ja: 'コメディ' },
  Drama: { en: 'Drama', ko: '드라마', ja: 'ドラマ' },
  Ecchi: { en: 'Ecchi', ko: '엣치', ja: 'エッチ' },
  Fantasy: { en: 'Fantasy', ko: '판타지', ja: 'ファンタジー' },
  Horror: { en: 'Horror', ko: '호러', ja: 'ホラー' },
  'Mahou Shoujo': { en: 'Magical Girl', ko: '마법소녀', ja: '魔法少女' },
  Mecha: { en: 'Mecha', ko: '메카', ja: 'メカ' },
  Music: { en: 'Music', ko: '음악', ja: '音楽' },
  Mystery: { en: 'Mystery', ko: '미스터리', ja: 'ミステリー' },
  Psychological: { en: 'Psychological', ko: '심리', ja: '心理' },
  Romance: { en: 'Romance', ko: '로맨스', ja: 'ロマンス' },
  'Sci-Fi': { en: 'Sci-Fi', ko: 'SF', ja: 'SF' },
  'Slice of Life': { en: 'Slice of Life', ko: '일상', ja: '日常' },
  Sports: { en: 'Sports', ko: '스포츠', ja: 'スポーツ' },
  Supernatural: { en: 'Supernatural', ko: '초자연', ja: '超自然' },
  Thriller: { en: 'Thriller', ko: '스릴러', ja: 'スリラー' },
};

export const DEMOGRAPHIC_LABELS: Record<string, Localized> = {
  Shounen: { en: 'shounen', ko: '소년', ja: '少年' },
  Seinen: { en: 'seinen', ko: '청년', ja: '青年' },
  Shoujo: { en: 'shoujo', ko: '소녀', ja: '少女' },
  Josei: { en: 'josei', ko: '여성향', ja: '女性向け' },
  Kids: { en: 'kids', ko: '아동용', ja: '子ども向け' },
};

/**
 * Curated themed-tag table. Keys must be REAL AniList tag names
 * (verified against MediaTagCollection); the table doubles as the
 * allowlist that keeps meta tags out of reason lines.
 */
export const TAG_LABELS: Record<string, Localized> = {
  School: { en: 'school', ko: '학교', ja: '学校' },
  'School Club': { en: 'school club', ko: '동아리', ja: '部活' },
  'Martial Arts': { en: 'martial arts', ko: '무술', ja: '武術' },
  Magic: { en: 'magic', ko: '마법', ja: '魔法' },
  Demons: { en: 'demons', ko: '악마', ja: '悪魔' },
  'Time Manipulation': { en: 'time manipulation', ko: '시간 조작', ja: '時間操作' },
  'Time Loop': { en: 'time loop', ko: '타임루프', ja: 'タイムループ' },
  Isekai: { en: 'isekai', ko: '이세계', ja: '異世界' },
  'Super Power': { en: 'super powers', ko: '초능력', ja: '超能力' },
  Henshin: { en: 'henshin hero', ko: '변신 히어로', ja: '変身ヒーロー' },
  Swordplay: { en: 'swordplay', ko: '검술', ja: '剣術' },
  Military: { en: 'military', ko: '밀리터리', ja: 'ミリタリー' },
  Space: { en: 'space', ko: '우주', ja: '宇宙' },
  Cyberpunk: { en: 'cyberpunk', ko: '사이버펑크', ja: 'サイバーパンク' },
  'Post-Apocalyptic': { en: 'post-apocalyptic', ko: '포스트 아포칼립스', ja: '終末世界' },
  Dystopian: { en: 'dystopia', ko: '디스토피아', ja: 'ディストピア' },
  'Urban Fantasy': { en: 'urban fantasy', ko: '도시 판타지', ja: 'アーバンファンタジー' },
  Mythology: { en: 'mythology', ko: '신화', ja: '神話' },
  Dragons: { en: 'dragons', ko: '드래곤', ja: 'ドラゴン' },
  Vampire: { en: 'vampires', ko: '뱀파이어', ja: '吸血鬼' },
  Zombie: { en: 'zombies', ko: '좀비', ja: 'ゾンビ' },
  Ghost: { en: 'ghosts', ko: '유령', ja: '幽霊' },
  'Monster Boy': { en: 'monster boy', ko: '몬스터 소년', ja: 'モンスター少年' },
  'Monster Girl': { en: 'monster girl', ko: '몬스터 소녀', ja: 'モンスター少女' },
  Kaiju: { en: 'kaiju', ko: '괴수', ja: '怪獣' },
  Survival: { en: 'survival', ko: '생존', ja: 'サバイバル' },
  Gore: { en: 'gore', ko: '고어', ja: 'ゴア' },
  'Body Horror': { en: 'body horror', ko: '바디 호러', ja: 'ボディホラー' },
  Tragedy: { en: 'tragedy', ko: '비극', ja: '悲劇' },
  Revenge: { en: 'revenge', ko: '복수', ja: '復讐' },
  'Anti-Hero': { en: 'anti-hero', ko: '안티히어로', ja: 'アンチヒーロー' },
  Crime: { en: 'crime', ko: '범죄', ja: '犯罪' },
  Detective: { en: 'detective', ko: '탐정', ja: '探偵' },
  Police: { en: 'police', ko: '경찰', ja: '警察' },
  Mafia: { en: 'mafia', ko: '마피아', ja: 'マフィア' },
  Yakuza: { en: 'yakuza', ko: '야쿠자', ja: 'ヤクザ' },
  Delinquents: { en: 'delinquents', ko: '불량배', ja: 'ヤンキー' },
  Assassins: { en: 'assassins', ko: '암살자', ja: '暗殺者' },
  Espionage: { en: 'espionage', ko: '스파이', ja: 'スパイ' },
  Gambling: { en: 'gambling', ko: '도박', ja: 'ギャンブル' },
  Historical: { en: 'historical', ko: '시대물', ja: '歴史もの' },
  Samurai: { en: 'samurai', ko: '사무라이', ja: '侍' },
  Ninja: { en: 'ninja', ko: '닌자', ja: '忍者' },
  Pirates: { en: 'pirates', ko: '해적', ja: '海賊' },
  War: { en: 'war', ko: '전쟁', ja: '戦争' },
  'Coming of Age': { en: 'coming of age', ko: '성장물', ja: '成長物語' },
  Slapstick: { en: 'slapstick', ko: '슬랩스틱', ja: 'ドタバタ' },
  Parody: { en: 'parody', ko: '패러디', ja: 'パロディ' },
  'Love Triangle': { en: 'love triangle', ko: '삼각관계', ja: '三角関係' },
  'Unrequited Love': { en: 'unrequited love', ko: '짝사랑', ja: '片想い' },
  Marriage: { en: 'marriage', ko: '결혼', ja: '結婚' },
  Idol: { en: 'idols', ko: '아이돌', ja: 'アイドル' },
  Band: { en: 'band', ko: '밴드', ja: 'バンド' },
  Food: { en: 'food', ko: '요리·음식', ja: 'グルメ' },
  Work: { en: 'work', ko: '직업물', ja: 'お仕事' },
  Office: { en: 'office', ko: '직장', ja: '職場' },
  Iyashikei: { en: 'iyashikei', ko: '힐링', ja: '癒し系' },
  Reincarnation: { en: 'reincarnation', ko: '환생', ja: '転生' },
  'Video Games': { en: 'video games', ko: '게임', ja: 'ゲーム' },
  Basketball: { en: 'basketball', ko: '농구', ja: 'バスケ' },
  Baseball: { en: 'baseball', ko: '야구', ja: '野球' },
  Football: { en: 'soccer', ko: '축구', ja: 'サッカー' },
  Volleyball: { en: 'volleyball', ko: '배구', ja: 'バレーボール' },
  Boxing: { en: 'boxing', ko: '복싱', ja: 'ボクシング' },
  Swimming: { en: 'swimming', ko: '수영', ja: '水泳' },
  Tennis: { en: 'tennis', ko: '테니스', ja: 'テニス' },
  Cycling: { en: 'cycling', ko: '사이클', ja: '自転車' },
};

export function genreLabel(name: string, lang: Language): string {
  return GENRE_LABELS[name]?.[lang] ?? name;
}

/** Reason-line label for any canonical name (demographic, genre, or tag). */
export function reasonLabel(name: string, lang: Language): string {
  const label =
    DEMOGRAPHIC_LABELS[name]?.[lang] ?? GENRE_LABELS[name]?.[lang] ?? TAG_LABELS[name]?.[lang];
  if (label === undefined) return name;
  // English genre labels are stored capitalized for chips; reasons read
  // better lowercase ("Both are shounen + action").
  return lang === 'en' ? label.toLowerCase() : label;
}
