import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Manga } from '../api/anilist';
import { useAuth } from '../auth/AuthContext';
import { FavoriteStar } from '../components/FavoriteStar';
import { StarRating } from '../components/StarRating';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import { useLanguage } from '../i18n/LanguageContext';
import { displayTitle, secondaryTitle } from '../lib/titles';
import { useUserData, type SavedManga } from '../user/UserDataContext';
import { centeredContent } from '../lib/layout';
import { colors, radius, spacing, typography } from '../theme';

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

export function LibraryScreen() {
  const tr = useT();
  const { data } = useUserData();

  const items = Object.entries(data).map(([id, entry]) => ({ manga: toManga(id, entry), entry }));
  const favorites = items
    .filter((it) => it.entry.favorite)
    .sort((a, b) => b.entry.savedAt - a.entry.savedAt);
  const rated = items
    .filter((it) => it.entry.rating != null)
    .sort((a, b) => (b.entry.rating ?? 0) - (a.entry.rating ?? 0));

  const sections = [
    ...(favorites.length > 0 ? [{ title: tr('libFavorites'), data: favorites }] : []),
    ...(rated.length > 0 ? [{ title: tr('libRated'), data: rated }] : []),
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ThemedText weight="bold" size={typography.header} style={styles.header}>
        {tr('tabLibrary')}
      </ThemedText>
      <AuthStatusRow />
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
            <ThemedText weight="bold" size={typography.section} style={styles.sectionHeader}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => <LibraryRow item={item} />}
        />
      )}
    </SafeAreaView>
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
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
          {tr('syncOn')}
        </ThemedText>
        <Pressable onPress={() => void signOutToGuest()} hitSlop={8}>
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

function LibraryRow({ item }: { item: LibraryItem }) {
  const tr = useT();
  const { lang } = useLanguage();
  const { manga } = item;
  const cover = manga.coverImage.large ?? manga.coverImage.extraLarge;
  const primary = displayTitle(manga, lang);
  const secondary = secondaryTitle(manga, lang);

  return (
    <View style={styles.row}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...centeredContent,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  authRow: {
    ...centeredContent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  authGuest: {
    ...centeredContent,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  notePressed: {
    opacity: 0.6,
  },
  empty: {
    ...centeredContent,
    marginTop: spacing.xxl,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    ...centeredContent,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
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
