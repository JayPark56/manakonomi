import { StyleSheet, View } from 'react-native';
import { useT } from '../i18n/LanguageContext';
import { ThemedText } from './ThemedText';
import { spacing, typography } from '../theme';

/** Fixed across all languages — these three lines are NOT localized. */
const TITLE_LINES = ['마나코노미.', 'Manakonomi.', 'マナコノミ.'];

/** Subtitle in coral pink (same color across all languages). */
const SUBTITLE_COLOR = '#FF6B81';

/**
 * Shared brand block (3-line title + localized subtitle) used by both the
 * splash overlay and the onboarding screen so they line up pixel-for-pixel.
 */
export function BrandHero() {
  const tr = useT();
  return (
    <View style={styles.container}>
      {TITLE_LINES.map((line) => (
        <ThemedText
          key={line}
          weight="black"
          size={typography.display}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={styles.titleLine}
        >
          {line}
        </ThemedText>
      ))}
      <ThemedText weight="light" size={typography.subtitle} color={SUBTITLE_COLOR} style={styles.subtitle}>
        {tr('splashSubtitle')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  titleLine: {
    lineHeight: 44,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
    lineHeight: 21,
  },
});
