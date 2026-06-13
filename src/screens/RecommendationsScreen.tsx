import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  errorKindOf,
  fetchRecommendations,
  type AniListErrorKind,
  type Manga,
} from '../api/anilist';
import { FavoriteStar } from '../components/FavoriteStar';
import { MangaCard } from '../components/MangaCard';
import { StarRating } from '../components/StarRating';
import { ThemedText } from '../components/ThemedText';
import { type StringKey } from '../i18n/i18n';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { buildReasonTokens, formatReason } from '../lib/reason';
import {
  buildTasteProfile,
  poolCandidates,
  scoreByProfile,
  sharedTasteOf,
  type PooledCandidate,
} from '../lib/taste';
import { useGridLayout, centeredContent } from '../lib/layout';
import { displayTitle } from '../lib/titles';
import { useUserData } from '../user/UserDataContext';
import { colors, radius, spacing, typography } from '../theme';

const ERROR_KEY: Record<AniListErrorKind, StringKey> = {
  'rate-limit': 'errRateLimit',
  network: 'errNetwork',
  server: 'errServer',
};

interface RecommendationsScreenProps {
  /** One id = classic single-source view; several = combined view. */
  mangaIds: number[];
  onSelectRecommendation: (manga: Manga) => void;
  onBack: () => void;
}

interface LoadedData {
  sources: Manga[];
  candidates: PooledCandidate[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; kind: AniListErrorKind }
  | { status: 'done'; data: LoadedData };

export function RecommendationsScreen({
  mangaIds,
  onSelectRecommendation,
  onBack,
}: RecommendationsScreenProps) {
  const tr = useT();
  const { lang } = useLanguage();
  const { data: userData } = useUserData();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  const combined = mangaIds.length > 1;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    const perSourceLimit = mangaIds.length > 1 ? 12 : 5;
    Promise.all(mangaIds.map((id) => fetchRecommendations(id, controller.signal, perSourceLimit)))
      .then((results) => {
        if (controller.signal.aborted) return;
        const candidates = poolCandidates(results);
        setState({
          status: 'done',
          data: {
            sources: results.map((r) => r.source),
            candidates: mangaIds.length > 1 ? candidates.slice(0, 10) : candidates.slice(0, 5),
          },
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[Recommendations] failed:', err);
        setState({ status: 'error', kind: errorKindOf(err) });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaIds.join(','), retryKey]);

  const profile = useMemo(() => buildTasteProfile(userData), [userData]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
        {({ pressed }) => (
          <ThemedText
            weight="medium"
            size={typography.button}
            color={pressed ? colors.accent : colors.textPrimary}
          >
            ‹ {tr('back')}
          </ThemedText>
        )}
      </Pressable>

      {state.status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} size="large" />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.center}>
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.errorText}>
            {tr(ERROR_KEY[state.kind])}
          </ThemedText>
          <Pressable onPress={() => setRetryKey((k) => k + 1)} hitSlop={8}>
            {({ pressed }) => (
              <ThemedText
                weight="semiBold"
                size={typography.rowTitle}
                color={pressed ? colors.accent : colors.textPrimary}
                style={styles.retry}
              >
                {tr('retry')}
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}

      {state.status === 'done' && (
        <RecommendationsContent
          data={state.data}
          combined={combined}
          profile={profile}
          lang={lang}
          onSelect={onSelectRecommendation}
        />
      )}
    </View>
  );
}

function RecommendationsContent({
  data,
  combined,
  profile,
  lang,
  onSelect,
}: {
  data: LoadedData;
  combined: boolean;
  profile: ReturnType<typeof buildTasteProfile>;
  lang: ReturnType<typeof useLanguage>['lang'];
  onSelect: (manga: Manga) => void;
}) {
  const tr = useT();
  const { cardWidth } = useGridLayout();
  const { sources, candidates } = data;

  // Reasons compare against the single source, or the shared taste of the set.
  const reasonSource = combined ? sharedTasteOf(sources) : sources[0];
  const connector = combined ? (sources.length === 2 ? 'matchesBoth' : 'matchesAll') : 'both';
  const reasonOf = (manga: Manga) =>
    formatReason(buildReasonTokens(reasonSource, manga), lang, connector);

  const hasProfile = profile.size > 0;
  const byRatings = hasProfile
    ? [...candidates].sort((a, b) => scoreByProfile(profile, b.manga) - scoreByProfile(profile, a.manga))
    : candidates;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {combined ? <PicksHeader sources={sources} /> : <SourceHeader source={sources[0]} />}

      {candidates.length === 0 ? (
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.empty}>
          {tr('noRecs')}
        </ThemedText>
      ) : (
        <>
          <ThemedText weight="bold" size={typography.section} style={styles.sectionHeader}>
            {tr('secFansAlsoLike')}
          </ThemedText>
          <View style={styles.grid}>
            {candidates.map((c) => (
              <MangaCard
                key={c.manga.id}
                manga={c.manga}
                reason={reasonOf(c.manga)}
                width={cardWidth}
                onPress={() => onSelect(c.manga)}
              />
            ))}
          </View>

          <ThemedText weight="bold" size={typography.section} style={styles.sectionHeader}>
            {tr('secBasedOnRatings')}
          </ThemedText>
          {!hasProfile && (
            <ThemedText
              weight="medium"
              size={typography.caption}
              color={colors.textSecondary}
              style={styles.ratingsNote}
            >
              {tr('ratingsNote')}
            </ThemedText>
          )}
          <View style={styles.grid}>
            {byRatings.map((c) => (
              <MangaCard
                key={c.manga.id}
                manga={c.manga}
                reason={reasonOf(c.manga)}
                width={cardWidth}
                onPress={() => onSelect(c.manga)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SourceHeader({ source }: { source: Manga }) {
  const tr = useT();
  const { lang } = useLanguage();
  const cover = source.coverImage.large ?? source.coverImage.extraLarge;
  return (
    <View style={styles.sourceHeader}>
      {cover && <Image source={{ uri: cover }} style={styles.sourceCover} />}
      <View style={styles.sourceText}>
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
          {tr('similarTo')}
        </ThemedText>
        <ThemedText weight="bold" size={typography.source} numberOfLines={2}>
          {displayTitle(source, lang) ?? tr('noTitle')}
        </ThemedText>
        <View style={styles.sourceRating}>
          <StarRating manga={source} size={20} />
        </View>
      </View>
      <FavoriteStar manga={source} size={24} />
    </View>
  );
}

function PicksHeader({ sources }: { sources: Manga[] }) {
  const tr = useT();
  const { lang } = useLanguage();
  return (
    <View style={styles.picksHeader}>
      <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
        {tr('similarToPicks')}
      </ThemedText>
      <View style={styles.picksRow}>
        {sources.map((source) => {
          const cover = source.coverImage.large ?? source.coverImage.extraLarge;
          return cover ? (
            <Image key={source.id} source={{ uri: cover }} style={styles.pickCover} />
          ) : null;
        })}
      </View>
      <ThemedText weight="bold" size={typography.source} numberOfLines={2}>
        {sources.map((s) => displayTitle(s, lang) ?? tr('noTitle')).join(' + ')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...centeredContent,
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  retry: {
    padding: spacing.sm,
  },
  errorText: {
    textAlign: 'center',
  },
  scrollContent: {
    // container already caps + centers the screen; just pad the content here.
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  sourceCover: {
    width: 64,
    height: 92,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  sourceText: {
    flex: 1,
    gap: spacing.xs,
  },
  sourceRating: {
    marginTop: spacing.xs,
  },
  picksHeader: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  picksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickCover: {
    width: 48,
    height: 69,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  ratingsNote: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
});
