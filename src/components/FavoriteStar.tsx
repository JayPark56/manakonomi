import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Manga } from '../api/anilist';
import { useT } from '../i18n/LanguageContext';
import { useUserData } from '../user/UserDataContext';
import { colors } from '../theme';

interface FavoriteStarProps {
  manga: Manga;
  size?: number;
  /** Dark scrim behind the star for use on top of cover images. */
  onCover?: boolean;
}

/** Favorite toggle: filled accent star when favorited, outline otherwise. */
export function FavoriteStar({ manga, size = 20, onCover = false }: FavoriteStarProps) {
  const tr = useT();
  const { favoriteOf, toggleFavorite } = useUserData();
  const favorite = favoriteOf(manga.id);

  return (
    <Pressable
      onPress={() => toggleFavorite(manga)}
      hitSlop={8}
      style={onCover && styles.scrim}
      accessibilityRole="button"
      accessibilityLabel={tr('a11yFavorite')}
      accessibilityState={{ selected: favorite }}
      testID="favorite"
    >
      <Ionicons
        name={favorite ? 'star' : 'star-outline'}
        size={size}
        color={favorite ? colors.accent : colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: colors.scrim,
    borderRadius: 16,
    padding: 6,
  },
});
