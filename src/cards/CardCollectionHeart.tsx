import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TcgCard } from '../tcg/optcgApi';
import { useT } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { useCardCollection } from './CardCollectionContext';

interface CardCollectionHeartProps {
  card: TcgCard;
  size?: number;
  /** Dark scrim behind the heart for use on top of card images. */
  onCover?: boolean;
}

/**
 * Collection toggle: filled coral heart when the card is in the collection,
 * outline otherwise. Mirrors FavoriteStar (manga) but targets the card store.
 * As a nested Pressable it captures its own taps, so it never triggers the
 * surrounding card's navigation.
 */
export function CardCollectionHeart({ card, size = 22, onCover = false }: CardCollectionHeartProps) {
  const tr = useT();
  const { isCollected, toggle } = useCardCollection();
  const collected = isCollected(card.id);

  return (
    <Pressable
      onPress={() => toggle(card)}
      hitSlop={8}
      style={onCover && styles.scrim}
      accessibilityRole="button"
      accessibilityLabel={tr('a11yCollect')}
      accessibilityState={{ selected: collected }}
      testID="collect-heart"
    >
      <Ionicons
        name={collected ? 'heart' : 'heart-outline'}
        size={size}
        color={collected ? colors.favorite : colors.textSecondary}
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
