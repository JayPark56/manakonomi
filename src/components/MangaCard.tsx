import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { Manga } from '../api/anilist';
import { useT, useLanguage } from '../i18n/LanguageContext';
import { displayTitle, secondaryTitle } from '../lib/titles';
import { FavoriteStar } from './FavoriteStar';
import { StarRating } from './StarRating';
import { ThemedText } from './ThemedText';
import { colors, radius, spacing, typography } from '../theme';

interface MangaCardProps {
  manga: Manga;
  reason: string;
  onPress: () => void;
  /** Explicit column width from the responsive grid layout. */
  width?: number;
}

/** Cover-grid card: high-res cover, titles, reason line, user controls. */
export function MangaCard({ manga, reason, onPress, width }: MangaCardProps) {
  const tr = useT();
  const { lang } = useLanguage();
  const cover = manga.coverImage.extraLarge ?? manga.coverImage.large;
  const primary = displayTitle(manga, lang);
  const secondary = secondaryTitle(manga, lang);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width != null ? { width } : styles.cardAuto,
        pressed && styles.cardPressed,
      ]}
    >
      {cover && <Image source={{ uri: cover }} style={styles.cover} />}
      <View style={styles.favorite}>
        <FavoriteStar manga={manga} onCover />
      </View>
      <View style={styles.body}>
        <ThemedText weight="semiBold" size={typography.cardTitle} numberOfLines={2}>
          {primary ?? tr('noTitle')}
        </ThemedText>
        {secondary != null && (
          <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} numberOfLines={1}>
            {secondary}
          </ThemedText>
        )}
        <ThemedText
          weight="medium"
          size={typography.micro}
          color={colors.textSecondary}
          numberOfLines={2}
          style={styles.reason}
        >
          {reason}
        </ThemedText>
        <View style={styles.rating}>
          <StarRating manga={manga} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Fallback sizing when no explicit grid width is supplied (2-up).
  cardAuto: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48.5%',
  },
  cardPressed: {
    borderColor: colors.accent,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: colors.background,
  },
  favorite: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  body: {
    padding: spacing.md,
    gap: 3,
  },
  reason: {
    marginTop: spacing.xs,
  },
  rating: {
    marginTop: spacing.sm,
  },
});
