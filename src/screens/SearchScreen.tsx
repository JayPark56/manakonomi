import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorKindOf, searchManga, type AniListErrorKind, type Manga } from '../api/anilist';
import { FavoriteStar } from '../components/FavoriteStar';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { ThemedText } from '../components/ThemedText';
import { genreLabel, type StringKey } from '../i18n/i18n';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { findKoAlias } from '../data/koAliases';
import { detectScript } from '../lib/script';
import { displayTitle, secondaryTitle } from '../lib/titles';
import { MAX_CONTENT_WIDTH } from '../lib/layout';
import { colors, fonts, radius, spacing, typography } from '../theme';

const ERROR_KEY: Record<AniListErrorKind, StringKey> = {
  'rate-limit': 'errRateLimit',
  network: 'errNetwork',
  server: 'errServer',
};

interface SearchScreenProps {
  onSelect: (manga: Manga) => void;
  /** Multi-select source set (Part 1.7). */
  selection: Manga[];
  onToggleSelection: (manga: Manga) => void;
  onClearSelection: () => void;
  onGetRecommendations: () => void;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; kind: AniListErrorKind }
  | { status: 'done'; results: Manga[] };

const DEBOUNCE_MS = 400;

export function SearchScreen({
  onSelect,
  selection,
  onToggleSelection,
  onClearSelection,
  onGetRecommendations,
}: SearchScreenProps) {
  const tr = useT();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ status: 'idle' });
      return;
    }
    // Korean queries: AniList's Korean synonym coverage is patchy, so a
    // known alias is rewritten to its canonical English/Japanese title.
    // Japanese and Latin queries go straight through.
    const alias = detectScript(q) === 'hangul' ? findKoAlias(q) : null;
    const effectiveQuery = alias?.canonical ?? q;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: 'loading' });
      searchManga(effectiveQuery, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setState({ status: 'done', results });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          console.warn('[Search] failed:', err);
          setState({ status: 'error', kind: errorKindOf(err) });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText
          weight="bold"
          size={typography.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={styles.headerTitle}
        >
          {tr('appTitle')}
        </ThemedText>
        <LanguageSwitch />
      </View>
      <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.subtitle}>
        {tr('subtitle')}
      </ThemedText>

      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder={tr('searchPlaceholder')}
        placeholderTextColor={colors.textPlaceholder}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      {selection.length > 0 && (
        <SelectionBar
          selection={selection}
          onRemove={onToggleSelection}
          onClear={onClearSelection}
          onGo={() => {
            Keyboard.dismiss();
            onGetRecommendations();
          }}
        />
      )}

      {state.status === 'idle' && (
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
          {tr('searchHint')}
        </ThemedText>
      )}
      {state.status === 'loading' && (
        <ActivityIndicator color={colors.textSecondary} style={styles.message} />
      )}
      {state.status === 'error' && (
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
          {tr(ERROR_KEY[state.kind])}
        </ThemedText>
      )}
      {state.status === 'done' && state.results.length === 0 && (
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.message}>
          {tr('emptySearch')}
        </ThemedText>
      )}
      {state.status === 'done' && state.results.length > 0 && (
        <FlatList
          data={state.results}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SearchResultRow
              manga={item}
              selected={selection.some((m) => m.id === item.id)}
              onPress={() => {
                Keyboard.dismiss();
                onSelect(item);
              }}
              onToggleSelect={() => onToggleSelection(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function SelectionBar({
  selection,
  onRemove,
  onClear,
  onGo,
}: {
  selection: Manga[];
  onRemove: (manga: Manga) => void;
  onClear: () => void;
  onGo: () => void;
}) {
  const tr = useT();
  const { lang } = useLanguage();

  return (
    <View style={styles.selectionBar}>
      <View style={styles.chipsWrap}>
        {selection.map((manga) => (
          <Pressable key={manga.id} onPress={() => onRemove(manga)} style={styles.chip} hitSlop={4}>
            <ThemedText weight="medium" size={typography.caption} color={colors.accent} numberOfLines={1} style={styles.chipTitle}>
              {displayTitle(manga, lang) ?? tr('noTitle')}
            </ThemedText>
            <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
              ✕
            </ThemedText>
          </Pressable>
        ))}
        <Pressable onPress={onClear} hitSlop={6} style={styles.clearButton}>
          {({ pressed }) => (
            <ThemedText
              weight="medium"
              size={typography.caption}
              color={pressed ? colors.accent : colors.textSecondary}
            >
              {tr('selectionClear')}
            </ThemedText>
          )}
        </Pressable>
      </View>
      <Pressable onPress={onGo} style={({ pressed }) => [styles.goButton, pressed && styles.goButtonPressed]}>
        {({ pressed }) => (
          <ThemedText weight="semiBold" size={typography.label} color={pressed ? colors.onAccent : colors.textPrimary}>
            {tr('selectionGo')} ({selection.length})
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

function SearchResultRow({
  manga,
  selected,
  onPress,
  onToggleSelect,
}: {
  manga: Manga;
  selected: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
}) {
  const tr = useT();
  const { lang } = useLanguage();
  const cover = manga.coverImage.large ?? manga.coverImage.extraLarge;
  const primary = displayTitle(manga, lang);
  const secondary = secondaryTitle(manga, lang);
  const genres = manga.genres.slice(0, 3).map((g) => genreLabel(g, lang)).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [styles.row, (pressed || selected) && styles.rowPressed]}
    >
      {cover && <Image source={{ uri: cover }} style={styles.rowCover} />}
      <View style={styles.rowText}>
        <ThemedText weight="semiBold" size={typography.rowTitle} numberOfLines={1}>
          {primary ?? tr('noTitle')}
        </ThemedText>
        {secondary != null && (
          <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} numberOfLines={1}>
            {secondary}
          </ThemedText>
        )}
        {genres.length > 0 && (
          <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} numberOfLines={1}>
            {genres}
          </ThemedText>
        )}
      </View>
      <Pressable
        onPress={onToggleSelect}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tr('a11ySelect')}
        accessibilityState={{ selected }}
        testID="select"
      >
        <Ionicons
          name={selected ? 'checkmark-circle' : 'add-circle-outline'}
          size={24}
          color={selected ? colors.accent : colors.textSecondary}
        />
      </Pressable>
      <FavoriteStar manga={manga} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTitle: {
    flexShrink: 1, // yield to the switcher rather than pushing it off-screen
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: typography.button,
    color: colors.textPrimary,
  },
  message: {
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  selectionBar: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipTitle: {
    maxWidth: 140,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  goButton: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  goButtonPressed: {
    backgroundColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowPressed: {
    borderColor: colors.accent,
  },
  rowCover: {
    width: 52,
    height: 74,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
