import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { CardCollectionHeart } from '../cards/CardCollectionHeart';
import { ThemedText } from '../components/ThemedText';
import { type StringKey } from '../i18n/i18n';
import { useT } from '../i18n/LanguageContext';
import { useGridLayout } from '../lib/layout';
import {
  formatPrice,
  listCards,
  listSets,
  tcgErrorKind,
  type TcgCard,
  type TcgErrorKind,
  type TcgSet,
} from '../tcg/optcgApi';
import { colors, radius, spacing, typography } from '../theme';

const ERROR_KEY: Record<TcgErrorKind, StringKey> = {
  'rate-limit': 'errRateLimit',
  network: 'errNetwork',
  server: 'errTcgServer',
};

type SetsState =
  | { status: 'loading' }
  | { status: 'error'; kind: TcgErrorKind }
  | { status: 'done'; sets: TcgSet[] };

type CardsState =
  | { status: 'loading' }
  | { status: 'error'; kind: TcgErrorKind }
  | { status: 'done'; cards: TcgCard[] };

type SortMode = 'default' | 'price';

export function TcgCardListScreen({
  onBack,
  onSelectCard,
  initialSetId,
}: {
  onBack: () => void;
  onSelectCard: (card: TcgCard) => void;
  /** Preselect this set (matched against the real set list); falls back to the
   *  newest booster if there's no exact match. Used by "View this set". */
  initialSetId?: string;
}) {
  const tr = useT();
  const [setsState, setSetsState] = useState<SetsState>({ status: 'loading' });
  const [activeSet, setActiveSet] = useState<TcgSet | null>(null);
  const [cardsState, setCardsState] = useState<CardsState>({ status: 'loading' });
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [retry, setRetry] = useState(0);

  // Load the set list once; default to the newest booster set.
  useEffect(() => {
    const controller = new AbortController();
    setSetsState({ status: 'loading' });
    listSets(controller.signal)
      .then((sets) => {
        if (controller.signal.aborted) return;
        setSetsState({ status: 'done', sets });
        const boosters = sets.filter((s) => s.kind === 'set');
        // "View this set": exact-match the card's set id against the real list
        // (handles irregular ids like OP15-EB04); else default to newest booster.
        const matched = initialSetId ? sets.find((s) => s.id === initialSetId) : undefined;
        const next = matched ?? boosters[boosters.length - 1] ?? sets[0] ?? null;
        setActiveSet(next);
        // No sets at all → settle the cards state to empty so the grid shows
        // the localized empty state instead of a permanent spinner.
        if (next == null) setCardsState({ status: 'done', cards: [] });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSetsState({ status: 'error', kind: tcgErrorKind(err) });
      });
    return () => controller.abort();
  }, [retry, initialSetId]);

  // Load the active set's cards whenever it changes.
  useEffect(() => {
    // No set (deselected via the chip toggle): clear any stale error/cards so
    // the prompt branch owns the render alone. 'loading' is never shown here —
    // the loading branch requires activeSet != null.
    if (!activeSet) {
      setCardsState({ status: 'loading' });
      return;
    }
    const controller = new AbortController();
    setCardsState({ status: 'loading' });
    listCards(activeSet.id, activeSet.kind, controller.signal)
      .then((cards) => {
        if (controller.signal.aborted) return;
        setCardsState({ status: 'done', cards });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setCardsState({ status: 'error', kind: tcgErrorKind(err) });
      });
    return () => controller.abort();
  }, [activeSet]);

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
          {tr('tcgTitle')}
        </ThemedText>
      </View>

      {setsState.status === 'done' && (
        <SetChipBar
          sets={setsState.sets}
          activeId={activeSet?.id ?? null}
          // Toggle: re-tapping the selected chip deselects to the no-set state.
          onSelect={(set) => setActiveSet((prev) => (prev?.id === set.id ? null : set))}
        />
      )}

      {setsState.status === 'done' && activeSet != null && (
        <View style={styles.sortRow}>
          <SortPill active={sortMode === 'default'} label={tr('tcgSortDefault')} onPress={() => setSortMode('default')} />
          <SortPill active={sortMode === 'price'} label={tr('tcgSortPrice')} onPress={() => setSortMode('price')} />
        </View>
      )}

      {(setsState.status === 'loading' ||
        (setsState.status === 'done' && activeSet != null && cardsState.status === 'loading')) && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} size="large" />
        </View>
      )}

      {/* No set selected (deselected via chip toggle): prompt to pick one. */}
      {setsState.status === 'done' && activeSet == null && (
        <View style={styles.center}>
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
            {tr(setsState.sets.length === 0 ? 'tcgEmpty' : 'tcgPickSet')}
          </ThemedText>
        </View>
      )}

      {/* A cards error only applies while a set is selected, so it can't coexist
          with the no-set prompt above. A sets-level error shows regardless. */}
      {(setsState.status === 'error' || (activeSet != null && cardsState.status === 'error')) && (
        <View style={styles.center}>
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
            {tr(ERROR_KEY[setsState.status === 'error' ? setsState.kind : (cardsState as { kind: TcgErrorKind }).kind])}
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

      {setsState.status === 'done' && activeSet != null && cardsState.status === 'done' && (
        <CardGrid cards={cardsState.cards} sortMode={sortMode} onSelectCard={onSelectCard} />
      )}
    </View>
  );
}

function SetChipBar({
  sets,
  activeId,
  onSelect,
}: {
  sets: TcgSet[];
  activeId: string | null;
  onSelect: (set: TcgSet) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipBar}
    >
      {sets.map((set) => {
        const selected = set.id === activeId;
        return (
          <Pressable
            key={set.id}
            onPress={() => onSelect(set)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <ThemedText
              weight={selected ? 'semiBold' : 'medium'}
              size={typography.caption}
              color={selected ? colors.onAccent : colors.textSecondary}
            >
              {set.id}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
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
  cards: TcgCard[];
  sortMode: SortMode;
  onSelectCard: (card: TcgCard) => void;
}) {
  const tr = useT();
  const { numColumns, cardWidth, gap } = useGridLayout();
  // FlatList must remount when the column count changes.
  const listKey = useRef(0);
  const columnsRef = useRef(numColumns);
  if (columnsRef.current !== numColumns) {
    columnsRef.current = numColumns;
    listKey.current += 1;
  }

  // Price sort is high→low with no-price cards last; default keeps API order.
  // Array.sort is stable, so equal prices keep their original order.
  const data = useMemo(() => {
    if (sortMode !== 'price') return cards;
    return [...cards].sort((a, b) => (b.marketPrice ?? -1) - (a.marketPrice ?? -1));
  }, [cards, sortMode]);

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary}>
          {tr('tcgEmpty')}
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
        <TcgCardTile card={item} width={cardWidth} onPress={() => onSelectCard(item)} />
      )}
    />
  );
}

function TcgCardTile({
  card,
  width,
  onPress,
}: {
  card: TcgCard;
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
        <CardCollectionHeart game="one-piece" card={card} size={18} onCover />
      </View>
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
  // flexGrow/Shrink 0 keeps the horizontal bar from being collapsed to a sliver
  // by the grid below it (the bug: it shrank to ~10px and clipped the chips).
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipBar: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingRight: spacing.xl,
    alignItems: 'center',
  },
  grid: {
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  sortPillActive: {
    backgroundColor: colors.accent,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  message: {
    textAlign: 'center',
  },
  retry: {
    padding: spacing.sm,
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
    aspectRatio: 5 / 7, // standard OPTCG card ratio
    backgroundColor: colors.background,
  },
  tileHeart: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
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
