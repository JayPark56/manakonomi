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
  server: 'errServer',
};

type SetsState =
  | { status: 'loading' }
  | { status: 'error'; kind: TcgErrorKind }
  | { status: 'done'; sets: TcgSet[] };

type CardsState =
  | { status: 'loading' }
  | { status: 'error'; kind: TcgErrorKind }
  | { status: 'done'; cards: TcgCard[] };

export function TcgCardListScreen({
  onBack,
  onSelectCard,
}: {
  onBack: () => void;
  onSelectCard: (card: TcgCard) => void;
}) {
  const tr = useT();
  const [setsState, setSetsState] = useState<SetsState>({ status: 'loading' });
  const [activeSet, setActiveSet] = useState<TcgSet | null>(null);
  const [cardsState, setCardsState] = useState<CardsState>({ status: 'loading' });
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
        const next = boosters[boosters.length - 1] ?? sets[0] ?? null;
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
  }, [retry]);

  // Load the active set's cards whenever it changes.
  useEffect(() => {
    if (!activeSet) return;
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
          onSelect={setActiveSet}
        />
      )}

      {(setsState.status === 'loading' || (setsState.status === 'done' && cardsState.status === 'loading')) && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} size="large" />
        </View>
      )}

      {(setsState.status === 'error' || cardsState.status === 'error') && (
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

      {setsState.status === 'done' && cardsState.status === 'done' && (
        <CardGrid cards={cardsState.cards} onSelectCard={onSelectCard} />
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

function CardGrid({
  cards,
  onSelectCard,
}: {
  cards: TcgCard[];
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

  const data = useMemo(() => cards, [cards]);

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
  chipBar: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingRight: spacing.xl,
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
