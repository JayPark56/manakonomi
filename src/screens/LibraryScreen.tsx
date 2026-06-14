import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Slider from '@react-native-community/slider';
import { Ionicons, Octicons } from '@expo/vector-icons';
import type { Manga } from '../api/anilist';
import { useAuth } from '../auth/AuthContext';
import { useRecsRequest, type RootTabParamList } from '../nav/RecsRequestContext';
import { FavoriteStar } from '../components/FavoriteStar';
import { StarRating } from '../components/StarRating';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import { useLanguage } from '../i18n/LanguageContext';
import { displayTitle, secondaryTitle } from '../lib/titles';
import { useUserData, type SavedManga } from '../user/UserDataContext';
import { type CollectedCard } from '../cards/CardCollectionContext';
import { CardCollectionScreen } from './CardCollectionScreen';
import { TcgCardDetailScreen } from './TcgCardDetailScreen';
import { centeredContent } from '../lib/layout';
import { colors, radius, spacing, typography } from '../theme';

type CardNav = { view: 'list' } | { view: 'detail'; card: CollectedCard };

/** A SavedManga entry rebuilt into the Manga shape the components expect. */
function toManga(id: string, entry: SavedManga): Manga {
  return {
    id: Number(id),
    title: entry.title,
    coverImage: entry.coverImage,
    genres: entry.genres,
    tags: entry.tags,
  };
}

interface LibraryItem {
  manga: Manga;
  entry: SavedManga;
}

interface LibrarySection {
  id: 'favorites' | 'rated';
  title: string;
  data: LibraryItem[];
  /** Rated section only: true when the rating filter hid every item. */
  emptyByFilter?: boolean;
}

export function LibraryScreen() {
  const tr = useT();
  const { data } = useUserData();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { requestRecs } = useRecsRequest();
  // Minimum-rating filter for the Rated section (0 = show all), in 0.5 steps.
  const [minRating, setMinRating] = useState(0);
  // Card-collection sub-navigation overlay (list ↔ detail).
  const [cardNav, setCardNav] = useState<CardNav | null>(null);

  // Tapping a manga opens its recommendations in the Search tab (same flow as
  // tapping a search result), then switches to that tab.
  const openRecs = useCallback(
    (manga: Manga) => {
      requestRecs(manga.id);
      navigation.navigate('search');
    },
    [requestRecs, navigation],
  );

  if (cardNav) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        {cardNav.view === 'list' ? (
          <CardCollectionScreen
            onBack={() => setCardNav(null)}
            onSelectCard={(card) => setCardNav({ view: 'detail', card })}
          />
        ) : (
          <TcgCardDetailScreen card={cardNav.card} onBack={() => setCardNav({ view: 'list' })} />
        )}
      </SafeAreaView>
    );
  }

  const items = Object.entries(data).map(([id, entry]) => ({ manga: toManga(id, entry), entry }));
  const favorites = items
    .filter((it) => it.entry.favorite)
    .sort((a, b) => b.entry.savedAt - a.entry.savedAt);
  const ratedAll = items
    .filter((it) => it.entry.rating != null)
    .sort((a, b) => (b.entry.rating ?? 0) - (a.entry.rating ?? 0));
  const ratedFiltered = ratedAll.filter((it) => (it.entry.rating ?? 0) >= minRating);

  const sections: LibrarySection[] = [
    ...(favorites.length > 0
      ? [{ id: 'favorites' as const, title: tr('libFavorites'), data: favorites }]
      : []),
    // Keep the Rated section (and its slider) whenever any rating exists, even
    // if the filter currently hides them all.
    ...(ratedAll.length > 0
      ? [
          {
            id: 'rated' as const,
            title: tr('libRated'),
            data: ratedFiltered,
            emptyByFilter: ratedFiltered.length === 0,
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <ThemedText weight="bold" size={typography.header} style={styles.header}>
          {tr('tabLibrary')}
        </ThemedText>
        <AuthStatusRow />
        <Pressable
          onPress={() => setCardNav({ view: 'list' })}
          style={({ pressed }) => [styles.collectionEntry, pressed && styles.collectionEntryPressed]}
        >
          <Ionicons name="albums-outline" size={20} color={colors.accent} />
          <ThemedText weight="semiBold" size={typography.label} style={styles.collectionEntryLabel}>
            {tr('cardCollectionEntry')}
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
        {sections.length === 0 ? (
          <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.empty}>
            {tr('libraryEmpty')}
          </ThemedText>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${item.manga.id}:${index}`}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <ThemedText weight="bold" size={typography.section}>
                  {section.title}
                </ThemedText>
                {section.id === 'rated' && (
                  <RatedFilter value={minRating} onChange={setMinRating} />
                )}
              </View>
            )}
            renderSectionFooter={({ section }) =>
              section.id === 'rated' && section.emptyByFilter ? (
                <ThemedText
                  weight="medium"
                  size={typography.label}
                  color={colors.textSecondary}
                  style={styles.filterEmpty}
                >
                  {tr('ratedFilterEmpty')}
                </ThemedText>
              ) : null
            }
            renderItem={({ item }) => <LibraryRow item={item} onOpen={openRecs} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Minimum-rating slider (0–5, 0.5 steps) for the Rated section. */
function RatedFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tr = useT();
  return (
    <View style={styles.filterRow}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={5}
        step={0.5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.textPlaceholder}
        thumbTintColor={colors.accent}
      />
      <View style={styles.thresholdLabel}>
        {value <= 0 ? (
          <ThemedText weight="semiBold" size={typography.caption} color={colors.textSecondary}>
            {tr('ratingFilterAll')}
          </ThemedText>
        ) : (
          <>
            <ThemedText weight="semiBold" size={typography.caption} color={colors.textPrimary}>
              {value}
            </ThemedText>
            <Octicons name="star-fill" size={12} color={colors.accent} />
            <ThemedText weight="semiBold" size={typography.caption} color={colors.textPrimary}>
              {tr('ratingThresholdSuffix')}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Sign-in status. Signed in: a sync label + the existing sign-out control.
 * Guest: the sync note plus a Google sign-in button (reuses the same
 * AuthContext flow as onboarding, so merge-on-sign-in behaves identically).
 */
function AuthStatusRow() {
  const tr = useT();
  const { mode, uid, busy, signInWithGoogle, signOutToGuest } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = useCallback(async () => {
    setError(null);
    const ok = await signInWithGoogle();
    // On success, onAuthStateChanged flips mode/uid and this row re-renders to
    // the signed-in state; on failure/cancel we stay guest and show the error.
    if (!ok) setError(tr('signInError'));
  }, [signInWithGoogle, tr]);

  if (mode === 'google' && uid) {
    return (
      <View style={styles.authRow}>
        <ThemedText
          weight="medium"
          size={typography.caption}
          color={colors.textSecondary}
          numberOfLines={1}
          style={styles.authAccount}
        >
          {tr('syncOn')}
        </ThemedText>
        <Pressable onPress={() => void signOutToGuest()} hitSlop={8} style={styles.signOut}>
          {({ pressed }) => (
            <ThemedText weight="semiBold" size={typography.caption} color={pressed ? colors.accent : colors.textPrimary}>
              {tr('signOut')}
            </ThemedText>
          )}
        </Pressable>
      </View>
    );
  }

  // Split the localized note around its link token so only "Sign in"/"로그인"/
  // "ログイン" is the colored, tappable call-to-action.
  const note = tr('guestSyncNote');
  const link = tr('guestSyncNoteLink');
  const linkAt = note.indexOf(link);
  const before = linkAt >= 0 ? note.slice(0, linkAt) : '';
  const after = linkAt >= 0 ? note.slice(linkAt + link.length) : note;

  return (
    <View style={styles.authGuest}>
      <Pressable onPress={() => void handleGoogle()} disabled={busy} hitSlop={6}>
        {({ pressed }) => (
          <ThemedText
            weight="light"
            size={typography.label}
            color={colors.textSecondary}
            style={(pressed || busy) && styles.notePressed}
          >
            {before}
            {linkAt >= 0 && (
              <ThemedText weight="semiBold" size={typography.label} color={colors.accent}>
                {link}
              </ThemedText>
            )}
            {after}
          </ThemedText>
        )}
      </Pressable>
      {busy && <ActivityIndicator size="small" color={colors.accent} />}
      {error != null && (
        <ThemedText weight="medium" size={typography.caption} color={colors.accent}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

function LibraryRow({ item, onOpen }: { item: LibraryItem; onOpen: (manga: Manga) => void }) {
  const tr = useT();
  const { lang } = useLanguage();
  const { manga } = item;
  const cover = manga.coverImage.large ?? manga.coverImage.extraLarge;
  const primary = displayTitle(manga, lang);
  const secondary = secondaryTitle(manga, lang);

  // Row opens recommendations; the nested heart and star controls capture their
  // own taps (so rating/favoriting never triggers navigation).
  return (
    <Pressable onPress={() => onOpen(manga)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
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
        <View style={styles.rowRating}>
          <StarRating manga={manga} size={18} />
        </View>
      </View>
      <FavoriteStar manga={manga} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Centered/capped column (matches Search/Recommendations). Centering lives
  // here, NOT on the SectionList contentContainer, which clipped the sign-out
  // control and rows on narrow native viewports.
  container: {
    ...centeredContent,
    flex: 1,
  },
  header: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  // Account label takes remaining width (truncating); sign-out never shrinks.
  authAccount: {
    flex: 1,
  },
  signOut: {
    flexShrink: 0,
  },
  authGuest: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  collectionEntry: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  collectionEntryPressed: {
    opacity: 0.7,
  },
  collectionEntryLabel: {
    flex: 1, // pushes the chevron to the right edge; truncates if needed
  },
  notePressed: {
    opacity: 0.6,
  },
  empty: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  // Fixed width so the slider track doesn't reflow as the number's width changes.
  thresholdLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    minWidth: 58,
  },
  filterEmpty: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
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
  rowRating: {
    marginTop: spacing.xs,
  },
});
