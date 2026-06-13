import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  errorKindOf,
  fetchRecommendations,
  type AniListErrorKind,
  type Manga,
} from '../api/anilist';
import { MangaCard } from '../components/MangaCard';
import { ThemedText } from '../components/ThemedText';
import { formatReasonLine, reasonLabel, t as translate, type StringKey } from '../i18n/i18n';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { buildTasteProfile, profileMatchNames, scoreByProfile } from '../lib/taste';
import { useGridLayout, centeredContent } from '../lib/layout';
import { useUserData } from '../user/UserDataContext';
import { colors, radius, spacing, typography } from '../theme';
import { RecommendationsScreen } from './RecommendationsScreen';

const ERROR_KEY: Record<AniListErrorKind, StringKey> = {
  'rate-limit': 'errRateLimit',
  network: 'errNetwork',
  server: 'errServer',
};

const MIN_RATED = 3;
const MAX_SOURCES = 5;
const MAX_RESULTS = 12;

type PoolState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; kind: AniListErrorKind }
  | { status: 'done'; pool: Manga[] };

export function ForYouScreen() {
  const tr = useT();
  const { lang } = useLanguage();
  const navigation = useNavigation();
  const { numColumns, cardWidth } = useGridLayout();
  // For You covers are intentionally smaller (~22%) than the column-filling
  // width used elsewhere, in a fixed-width centered block so flexWrap still
  // yields exactly numColumns per row (2 on phone / 4 on desktop).
  const compactWidth = Math.round(cardWidth * 0.78);
  const gridColumnGap = spacing.md;
  const gridWidth = numColumns * compactWidth + (numColumns - 1) * gridColumnGap;
  const { data: userData } = useUserData();
  const [state, setState] = useState<PoolState>({ status: 'idle' });
  const [retryKey, setRetryKey] = useState(0);
  // Drill-down stack local to this tab.
  const [stack, setStack] = useState<number[][]>([]);

  const profile = useMemo(() => buildTasteProfile(userData), [userData]);

  // Candidate pool sources: the user's top-rated (>= 4) manga.
  const sourceIds = useMemo(() => {
    return Object.entries(userData)
      .filter(([, e]) => e.rating != null && e.rating >= 4)
      .sort((a, b) => (b[1].rating ?? 0) - (a[1].rating ?? 0))
      .slice(0, MAX_SOURCES)
      .map(([id]) => Number(id));
  }, [userData]);
  const sourceKey = sourceIds.join(',');
  const enoughRatings = sourceIds.length >= MIN_RATED;
  const isFocused = useIsFocused();
  // Tab screens stay mounted; only fetch while focused, and only when the
  // source set actually changed — otherwise every rating tap anywhere in the
  // app would fire 5 background AniList requests (and hit the rate limit).
  const fetchedKeyRef = useRef('');

  useEffect(() => {
    if (!enoughRatings) {
      setState({ status: 'idle' });
      fetchedKeyRef.current = '';
      return;
    }
    if (!isFocused || fetchedKeyRef.current === sourceKey) return;
    const controller = new AbortController();
    // Keep an existing grid visible while refreshing; live exclusion in the
    // results memo already handles just-rated cards.
    setState((prev) => (prev.status === 'done' ? prev : { status: 'loading' }));
    Promise.all(sourceIds.map((id) => fetchRecommendations(id, controller.signal, 12)))
      .then((results) => {
        if (controller.signal.aborted) return;
        const seen = new Set<number>();
        const pool = results
          .flatMap((r) => r.recommendations)
          .filter((m) => !seen.has(m.id) && seen.add(m.id));
        fetchedKeyRef.current = sourceKey;
        setState({ status: 'done', pool });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[ForYou] failed:', err);
        setState({ status: 'error', kind: errorKindOf(err) });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, enoughRatings, isFocused, retryKey]);

  // Exclusions and scoring react to live user-data changes without refetching.
  const results = useMemo(() => {
    if (state.status !== 'done') return [];
    return state.pool
      .filter((m) => userData[String(m.id)] === undefined) // not rated/favorited
      .map((m) => ({ manga: m, score: scoreByProfile(profile, m) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
  }, [state, userData, profile]);

  const reasonOf = (manga: Manga): string => {
    const names = profileMatchNames(profile, manga);
    if (names.length === 0) return translate('tasteMatchFallback', lang);
    return formatReasonLine('taste', names.map((n) => reasonLabel(n, lang)), lang);
  };

  const currentStackEntry = stack.length > 0 ? stack[stack.length - 1] : null;
  if (currentStackEntry != null) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <RecommendationsScreen
          key={currentStackEntry.join(',')}
          mangaIds={currentStackEntry}
          onSelectRecommendation={(manga) => setStack((prev) => [...prev, [manga.id]])}
          onBack={() => setStack((prev) => prev.slice(0, -1))}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <ThemedText weight="bold" size={typography.header} style={styles.header}>
          {tr('forYouTitle')}
        </ThemedText>

        {!enoughRatings && (
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.empty}>
            {tr('forYouEmpty')}
          </ThemedText>
        )}

        {enoughRatings && state.status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textSecondary} size="large" />
          </View>
        )}

        {enoughRatings && state.status === 'error' && (
          <View style={styles.center}>
            <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.errorText}>
              {tr(ERROR_KEY[state.kind])}
            </ThemedText>
            <Pressable
              onPress={() => {
                fetchedKeyRef.current = '';
                setRetryKey((k) => k + 1);
              }}
              hitSlop={8}
            >
              {({ pressed }) => (
                <ThemedText
                  weight="semiBold"
                  size={typography.rowTitle}
                  color={pressed ? colors.accent : colors.textPrimary}
                >
                  {tr('retry')}
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}

        {enoughRatings && state.status === 'done' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {results.length === 0 ? (
              <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.empty}>
                {tr('noRecs')}
              </ThemedText>
            ) : (
              <View style={[styles.grid, { width: gridWidth, columnGap: gridColumnGap }]}>
                {results.map(({ manga }) => (
                  <MangaCard
                    key={manga.id}
                    manga={manga}
                    reason={reasonOf(manga)}
                    width={compactWidth}
                    onPress={() => setStack([[manga.id]])}
                  />
                ))}
              </View>
            )}
            <Pressable
              onPress={() => navigation.navigate('search' as never)}
              style={({ pressed }) => [styles.browseMore, pressed && styles.browseMorePressed]}
            >
              <ThemedText weight="medium" size={typography.label} color={colors.accent}>
                {tr('browseMore')}
              </ThemedText>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Single centered/capped column (matches Search/Recommendations). Centering
  // lives here, NOT on the ScrollView contentContainer, which clipped row
  // content on narrow native viewports.
  container: {
    ...centeredContent,
    flex: 1,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  empty: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center', // center the fixed-width grid block, symmetric margins
    rowGap: spacing.lg,
  },
  browseMore: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  browseMorePressed: {
    backgroundColor: colors.card,
  },
});
