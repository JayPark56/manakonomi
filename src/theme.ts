/**
 * Manakonomi design tokens — Apple-style dark minimal.
 */
export const colors = {
  background: '#000000',
  card: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textPlaceholder: 'rgba(255, 255, 255, 0.35)',
  accent: '#FFD60A',
  /** Text/icons on accent-filled surfaces. */
  onAccent: '#000000',
  /** Dark scrim behind controls overlaid on cover images. */
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Shared typography scale (px). Tuned down in 2.6 for a tighter editorial feel
 * — adjust sizes here, not per-screen, so the hierarchy stays coherent.
 * Nothing drops below 11px.
 */
export const typography = {
  display: 38, // splash / onboarding title (auto-shrinks to fit one line)
  title: 28, // home brand header (fits the long "Manakonomi" beside the switcher)
  header: 24, // screen headers (Library / For You)
  source: 19, // recommendation source-manga title
  section: 18, // section headers
  button: 15, // CTA button labels + search input
  subtitle: 14, // splash / onboarding subtitle
  rowTitle: 14, // list row titles
  cardTitle: 13, // grid card titles
  label: 13, // secondary labels, status messages
  caption: 12, // romaji, genres, chips, small labels
  micro: 11.5, // reason lines, fine print
  tab: 11, // tab bar labels (floor)
} as const;

export const radius = 14;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/**
 * Paperlogy covers Latin, Korean, and Japanese (kana + kanji), so a single
 * family is used for every language — no per-language fallback needed.
 */
export const fonts = {
  light: 'Paperlogy-Light',
  regular: 'Paperlogy-Regular',
  medium: 'Paperlogy-Medium',
  semiBold: 'Paperlogy-SemiBold',
  bold: 'Paperlogy-Bold',
  black: 'Paperlogy-Black',
} as const;
