import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { type StringKey } from '../i18n/i18n';
import { useT } from '../i18n/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';
import { useIntro } from './IntroContext';

interface IntroCard {
  lib: 'ion' | 'oct';
  icon: string;
  color: string;
  title: StringKey;
  desc: StringKey;
}

const CARDS: IntroCard[] = [
  { lib: 'ion', icon: 'search', color: colors.accent, title: 'intro1Title', desc: 'intro1Desc' },
  { lib: 'ion', icon: 'add-circle', color: colors.accent, title: 'intro2Title', desc: 'intro2Desc' },
  { lib: 'ion', icon: 'heart', color: colors.favorite, title: 'intro3Title', desc: 'intro3Desc' },
  { lib: 'oct', icon: 'star-fill', color: colors.accent, title: 'intro4Title', desc: 'intro4Desc' },
  { lib: 'ion', icon: 'sync', color: colors.accent, title: 'intro5Title', desc: 'intro5Desc' },
];

export function IntroOverlay() {
  const tr = useT();
  const { visible, dismiss } = useIntro();
  const [index, setIndex] = useState(0);

  // Always start from card 1 each time the overlay opens.
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  if (!visible) return null;

  // Clamp defensively so a rapid double-advance can never index out of bounds.
  const safeIndex = Math.min(Math.max(index, 0), CARDS.length - 1);
  const card = CARDS[safeIndex];
  const isLast = safeIndex === CARDS.length - 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <Pressable onPress={dismiss} hitSlop={8}>
          {({ pressed }) => (
            <ThemedText weight="medium" size={typography.label} color={pressed ? colors.accent : colors.textSecondary}>
              {tr('introSkip')}
            </ThemedText>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          {card.lib === 'oct' ? (
            <Octicons name={card.icon as keyof typeof Octicons.glyphMap} size={52} color={card.color} />
          ) : (
            <Ionicons name={card.icon as keyof typeof Ionicons.glyphMap} size={56} color={card.color} />
          )}
        </View>
        <ThemedText weight="bold" size={typography.source} style={styles.title}>
          {tr(card.title)}
        </ThemedText>
        <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.desc}>
          {tr(card.desc)}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {CARDS.map((_, i) => (
            <View key={i} style={[styles.dot, i === safeIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          onPress={() => (isLast ? dismiss() : setIndex((i) => i + 1))}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <ThemedText weight="bold" size={typography.button} color={colors.onAccent}>
            {tr(isLast ? 'introDone' : 'introNext')}
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: spacing.xl,
    zIndex: 100,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.md,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    // Cap the text column so descriptions read well on a wide screen.
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 21,
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPlaceholder,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  button: {
    height: 52,
    borderRadius: radius,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
