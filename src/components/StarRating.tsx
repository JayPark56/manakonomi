import { Pressable, StyleSheet, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import type { Manga } from '../api/anilist';
import { a11yRateLabel } from '../i18n/i18n';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { useUserData } from '../user/UserDataContext';
import { colors } from '../theme';

interface StarRatingProps {
  manga: Manga;
  size?: number;
}

/**
 * Half-star rating control (0.5–5.0). Tapping the left half of star N sets
 * N-0.5, the right half sets N. Tapping the current value clears the rating.
 * Half fills render by clipping a filled star to 50% width over the outline.
 *
 * Touch handling: the half-zone Pressables carry generous hitSlop (the visual
 * glyphs are ~16-20pt), and the row itself is a no-op Pressable with padded
 * bounds so near-misses never fall through to a parent card's navigation.
 */
export function StarRating({ manga, size = 18 }: StarRatingProps) {
  const tr = useT();
  const { lang } = useLanguage();
  const { ratingOf, setRating } = useUserData();
  const rating = ratingOf(manga.id) ?? 0;

  const handlePress = (value: number) => {
    setRating(manga, value === ratingOf(manga.id) ? null : value);
  };

  return (
    <Pressable
      onPress={() => {}}
      style={styles.row}
      accessibilityLabel={tr('a11yRating')}
      accessibilityValue={{ text: a11yRateLabel(rating, lang) }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill: 'full' | 'half' | 'none' =
          rating >= star ? 'full' : rating >= star - 0.5 ? 'half' : 'none';
        return (
          <View key={star} style={{ width: size, height: size }}>
            {/* Octicons star is softer/rounder than the sharp Ionicons star.
                Filled glyph is clipped over the outline for half values; both
                share metrics so the 50%-width clip aligns cleanly. */}
            <Octicons name="star" size={size} color={colors.textSecondary} />
            {fill !== 'none' && (
              <View
                style={[
                  styles.fillClip,
                  { width: fill === 'full' ? size : size / 2, height: size },
                ]}
              >
                <Octicons name="star-fill" size={size} color={colors.accent} />
              </View>
            )}
            <Pressable
              onPress={() => handlePress(star - 0.5)}
              hitSlop={{ top: 12, bottom: 12, left: star === 1 ? 10 : 1 }}
              style={[styles.halfZone, { left: 0, width: size / 2, height: size }]}
              accessibilityRole="button"
              accessibilityLabel={a11yRateLabel(star - 0.5, lang)}
              testID={`rate-${star - 0.5}`}
            />
            <Pressable
              onPress={() => handlePress(star)}
              hitSlop={{ top: 12, bottom: 12, right: star === 5 ? 10 : 1 }}
              style={[styles.halfZone, { left: size / 2, width: size / 2, height: size }]}
              accessibilityRole="button"
              accessibilityLabel={a11yRateLabel(star, lang)}
              testID={`rate-${star}`}
            />
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
    // Padded touch bounds (visually cancelled by the negative margins) absorb
    // near-miss taps that would otherwise trigger the parent card's onPress.
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: -12,
    marginHorizontal: -10,
  },
  fillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  halfZone: {
    position: 'absolute',
    top: 0,
  },
});
