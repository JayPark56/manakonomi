import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { CardCollectionHeart } from '../cards/CardCollectionHeart';
import { ThemedText } from '../components/ThemedText';
import { type StringKey } from '../i18n/i18n';
import { useT } from '../i18n/LanguageContext';
import { useGridLayout } from '../lib/layout';
import {
  listHxHCards,
  sortCards,
  tcgErrorKind,
  type TcgErrorKind,
  type UaSortMode,
  type UnionArenaCard,
} from '../tcg/unionArenaApi';
import { colors, radius, spacing, typography } from '../theme';

const ERROR_KEY: Record<TcgErrorKind, StringKey> = {
  'rate-limit': 'errRateLimit',
  network: 'errNetwork',
  server: 'errTcgServer',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; kind: TcgErrorKind }
  | { status: 'done'; cards: UnionArenaCard[] };

export function UnionArenaCardListScreen({
  onBack,
  onSelectCard,
}: {
  onBack: () => void;
  onSelectCard: (card: UnionArenaCard) => void;
}) {
  const tr = useT();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [sortMode, setSortMode] = useState<UaSortMode>('default');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    listHxHCards(controller.signal)
      .then((cards) => {
        if (controller.signal.aborted) return;
        setState({ status: 'done', cards });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', kind: tcgErrorKind(err) });
      });
    return () => controller.abort();
  }, [retry]);

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
          {tr('uaTitle')}
        </ThemedText>
      </View>

      {state.status === 'done' && state.cards.length > 0 && (
        <View style={styles.sortRow}>
          <SortPill active={sortMode === 'default'} label={tr('tcgSortDefault')} onPress={() => setSortMode('default')} />
          <SortPill active={sortMode === 'rarity'} label={tr('uaSortRarity')} onPress={() => setSortMode('rarity')} />
        </View>
      )}

      {state.status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} size="large" />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.center}>
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
            {tr(ERROR_KEY[state.kind])}
          </ThemedText>
          <Pressable onPress={() => setRetry((k) => k + 1)} hitSlop={8}>
            {({ pressed }) => (
              <ThemedText weight="semiBold" size={typography.rowTitle} color={pressed ? colors.accent : colors.textPrimary} style={styles.retry}>
                {tr('retry')}
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}

      {state.status === 'done' && (
        <CardGrid cards={state.cards} sortMode={sortMode} onSelectCard={onSelectCard} />
      )}
    </View>
  );
}

function SortPill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
      <ThemedText
        weight={active ? 'semiBold' : 'medium'}
        size={typography.caption}
        color={active ? colors.onAccent : colors.textSecondary}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function CardGrid({
  cards,
  sortMode,
  onSelectCard,
}: {
  cards: UnionArenaCard[];
  sortMode: UaSortMode;
  onSelectCard: (card: UnionArenaCard) => void;
}) {
  const tr = useT();
  const { numColumns, cardWidth, gap } = useGridLayout();
  const listKey = useRef(0);
  const columnsRef = useRef(numColumns);
  if (columnsRef.current !== numColumns) {
    columnsRef.current = numColumns;
    listKey.current += 1;
  }

  const data = useMemo(() => sortCards(cards, sortMode), [cards, sortMode]);

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary}>
          {tr('uaEmpty')}
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      key={listKey.current}
      data={data}
      style={styles.grid}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
      contentContainerStyle={[styles.gridContent, { gap }]}
      initialNumToRender={12}
      windowSize={5}
      renderItem={({ item }) => (
        <CardTile card={item} width={cardWidth} onPress={() => onSelectCard(item)} />
      )}
    />
  );
}

function CardTile({
  card,
  width,
  onPress,
}: {
  card: UnionArenaCard;
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
      {/* Nested Pressable captures its own taps → no navigation into the card. */}
      <View style={styles.tileHeart}>
        <CardCollectionHeart game="union-arena" card={card} size={18} onCover />
      </View>
      <View style={styles.tileBody}>
        <ThemedText weight="semiBold" size={typography.cardTitle} numberOfLines={1}>
          {card.name}
        </ThemedText>
        {/* No price in this data source — show rarity where One Piece shows price. */}
        <ThemedText weight="medium" size={typography.micro} color={colors.textSecondary}>
          {card.rarity}
        </ThemedText>
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
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.card,
  },
  sortPillActive: {
    backgroundColor: colors.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.md,
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
  tileHeart: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  tileBody: {
    padding: spacing.sm,
    gap: 3,
  },
});
