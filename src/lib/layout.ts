import { useWindowDimensions } from 'react-native';
import { spacing } from '../theme';

/**
 * Content column is centered and capped at this width on large screens so the
 * app reads like a phone-width app even on a wide desktop browser.
 */
export const MAX_CONTENT_WIDTH = 920;

const H_PADDING = spacing.xl; // horizontal page padding, per side
const GRID_GAP = spacing.lg; // gap between grid cards
const MIN_CARD_WIDTH = 168; // target cover-card width before adding a column

export interface GridLayout {
  /** Capped, centered content width for the current viewport. */
  contentWidth: number;
  numColumns: number;
  cardWidth: number;
  gap: number;
}

/**
 * Responsive cover-grid metrics: 2 columns on a phone, growing to 4 once the
 * content reaches the MAX_CONTENT_WIDTH cap (≈196px covers at 920px). Content
 * is capped so covers never balloon on a wide desktop. cardWidth is an explicit
 * pixel width the grid hands to each card, which keeps a lone last-row card at
 * column width instead of stretching. (The Math.min ceiling is a safety bound;
 * raise MAX_CONTENT_WIDTH if more than 4 columns are ever wanted.)
 */
export function useGridLayout(): GridLayout {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const inner = contentWidth - H_PADDING * 2;
  const numColumns = Math.max(
    2,
    Math.min(6, Math.floor((inner + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP))),
  );
  const cardWidth = Math.floor((inner - GRID_GAP * (numColumns - 1)) / numColumns);
  return { contentWidth, numColumns, cardWidth, gap: GRID_GAP };
}

/** Centers and caps a scroll/list content column on wide screens. */
export const centeredContent = {
  width: '100%',
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: 'center',
} as const;
