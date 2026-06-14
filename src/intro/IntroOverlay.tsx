import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

// react-native-web only supports the JS animation driver.
const USE_NATIVE = Platform.OS !== 'web';
const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function IntroOverlay() {
  const tr = useT();
  const { visible, dismiss } = useIntro();
  const [index, setIndex] = useState(0);

  // Panel entrance (fade + rise) and per-card slide/fade transitions.
  const panelAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardShift = useRef(new Animated.Value(0)).current;
  // Guards a card transition from being re-entered (rapid double-tap on Next),
  // which would otherwise interrupt the exit animation and skip a card.
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setIndex(0);
    animatingRef.current = false;
    cardOpacity.setValue(1);
    cardShift.setValue(0);
    panelAnim.setValue(REDUCE_MOTION ? 1 : 0);
    if (!REDUCE_MOTION) {
      Animated.timing(panelAnim, { toValue: 1, duration: 260, useNativeDriver: USE_NATIVE }).start();
    }
  }, [visible, panelAnim, cardOpacity, cardShift]);

  if (!visible) return null;

  // Clamp defensively so a rapid double-advance can never index out of bounds.
  const safeIndex = Math.min(Math.max(index, 0), CARDS.length - 1);
  const card = CARDS[safeIndex];
  const isLast = safeIndex === CARDS.length - 1;

  const goNext = () => {
    if (REDUCE_MOTION) {
      setIndex((i) => i + 1);
      return;
    }
    if (animatingRef.current) return; // ignore taps while a transition runs
    animatingRef.current = true;
    // Slide the current card out to the left + fade, swap, then slide the next
    // in from the right + fade.
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 120, useNativeDriver: USE_NATIVE }),
      Animated.timing(cardShift, { toValue: -40, duration: 120, useNativeDriver: USE_NATIVE }),
    ]).start(({ finished }) => {
      if (!finished) {
        animatingRef.current = false;
        return;
      }
      setIndex((i) => i + 1);
      cardShift.setValue(40);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE }),
        Animated.timing(cardShift, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE }),
      ]).start(() => {
        animatingRef.current = false;
      });
    });
  };

  return (
    <View style={styles.scrim}>
      <Animated.View
        style={[
          styles.panel,
          {
            opacity: panelAnim,
            transform: [
              { translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              { scale: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <View style={styles.skipRow}>
          <Pressable onPress={dismiss} hitSlop={8}>
            {({ pressed }) => (
              <ThemedText weight="medium" size={typography.label} color={pressed ? colors.accent : colors.textSecondary}>
                {tr('introSkip')}
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Scrollable so the card body can never push Skip/Next off a short
            (e.g. landscape) viewport — the footer stays pinned below. */}
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.card, { opacity: cardOpacity, transform: [{ translateX: cardShift }] }]}
          >
            <View style={styles.iconWrap}>
              {card.lib === 'oct' ? (
                <Octicons name={card.icon as keyof typeof Octicons.glyphMap} size={48} color={card.color} />
              ) : (
                <Ionicons name={card.icon as keyof typeof Ionicons.glyphMap} size={52} color={card.color} />
              )}
            </View>
            <ThemedText weight="bold" size={typography.source} style={styles.title}>
              {tr(card.title)}
            </ThemedText>
            <ThemedText weight="medium" size={typography.label} color={colors.textSecondary} style={styles.desc}>
              {tr(card.desc)}
            </ThemedText>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {CARDS.map((_, i) => (
              <View key={i} style={[styles.dot, i === safeIndex && styles.dotActive]} />
            ))}
          </View>
          <Pressable
            onPress={() => (isLast ? dismiss() : goNext())}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <ThemedText weight="bold" size={typography.button} color={colors.onAccent}>
              {tr(isLast ? 'introDone' : 'introNext')}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Light scrim so the panel reads as a window floating over the app, not a
  // blacked-out screen.
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 100,
  },
  // Elevated, rounded floating panel.
  panel: {
    width: '100%',
    maxWidth: 420,
    // Never exceed the viewport; the card body scrolls instead of clipping.
    maxHeight: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
  },
  // Scroll wrapper shrinks within the capped panel; content centers when it fits.
  cardScroll: {
    flexShrink: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    minHeight: 230,
    paddingHorizontal: spacing.sm,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.background,
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
    gap: spacing.lg,
    marginTop: spacing.lg,
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
