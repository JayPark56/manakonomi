import { useMemo, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import { useGridLayout } from '../lib/layout';
import { formatPrice } from '../tcg/optcgApi';
import { useCardCollection, type CollectedCard } from '../cards/CardCollectionContext';
import { colors, radius, spacing, typography } from '../theme';

export function CardCollectionScreen({
  onBack,
  onSelectCard,
}: {
  onBack: () => void;
  onSelectCard: (card: CollectedCard) => void;
}) {
  const tr = useT();
  const { collection } = useCardCollection();

  // Most recently collected first.
  const cards = useMemo(
    () => Object.values(collection).sort((a, b) => b.savedAt - a.savedAt),
    [collection],
  );
  const total = useMemo(
    () => cards.reduce((sum, c) => sum + (c.marketPrice ?? 0), 0),
    [cards],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          {({ pressed }) => (
            <ThemedText weight="medium" size={typography.button} color={pressed ? colors.accent : colors.textPrimary}>
              ‹ {tr('back')}
            </ThemedText>
          )}
        </Pressable>
        <ThemedText weight="bold" size={typography.header} style={styles.title}>
          {tr('cardCollectionEntry')}
        </ThemedText>
        {cards.length > 0 && (
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.total}>
            {`${tr('cardCollectionTotal')} $${total.toFixed(2)}`}
          </ThemedText>
        )}
      </View>

      {cards.length === 0 ? (
        <View style={styles.center}>
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.empty}>
            {tr('cardCollectionEmpty')}
          </ThemedText>
        </View>
      ) : (
        <CollectionGrid cards={cards} onSelectCard={onSelectCard} />
      )}
    </View>
  );
}

function CollectionGrid({
  cards,
  onSelectCard,
}: {
  cards: CollectedCard[];
  onSelectCard: (card: CollectedCard) => void;
}) {
  const { numColumns, cardWidth, gap } = useGridLayout();
  // FlatList must remount when the column count changes.
  const listKey = useRef(0);
  const columnsRef = useRef(numColumns);
  if (columnsRef.current !== numColumns) {
    columnsRef.current = numColumns;
    listKey.current += 1;
  }

  return (
    <FlatList
      key={listKey.current}
      data={cards}
      style={styles.grid}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
      contentContainerStyle={[styles.gridContent, { gap }]}
      initialNumToRender={12}
      windowSize={5}
      renderItem={({ item }) => (
        <Tile card={item} width={cardWidth} onPress={() => onSelectCard(item)} />
      )}
    />
  );
}

function Tile({
  card,
  width,
  onPress,
}: {
  card: CollectedCard;
  width: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.tilePressed]}
    >
      {card.image ? (
        <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="contain" />
      ) : (
        <View style={[styles.cardImage, styles.cardImageEmpty]} />
      )}
      <View style={styles.tileBody}>
        <ThemedText weight="semiBold" size={typography.cardTitle} numberOfLines={1}>
          {card.name}
        </ThemedText>
        <View style={styles.tileMeta}>
          <ThemedText weight="medium" size={typography.micro} color={colors.textSecondary}>
            {card.rarity}
          </ThemedText>
          <ThemedText weight="semiBold" size={typography.micro} color={colors.accent}>
            {formatPrice(card.marketPrice)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
  },
  total: {
    marginTop: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  grid: {
    flex: 1,
    marginTop: spacing.md,
  },
  gridContent: {
    paddingBottom: spacing.xxl,
  },
  tile: {
    backgroundColor: colors.card,
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tilePressed: {
    borderColor: colors.accent,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 5 / 7,
    backgroundColor: colors.background,
  },
  cardImageEmpty: {
    opacity: 0.4,
  },
  tileBody: {
    padding: spacing.sm,
    gap: 3,
  },
  tileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
