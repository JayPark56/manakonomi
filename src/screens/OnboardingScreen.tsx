import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHero } from '../components/BrandHero';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';

interface OnboardingScreenProps {
  onGoogle: () => void;
  onGuest: () => void;
  /** Sign-in in progress (disables buttons, shows a spinner). */
  busy?: boolean;
  /** Localized sign-in error, if the last attempt failed. */
  error?: string | null;
}

/**
 * First-launch screen: the brand hero (same position as the splash) with two
 * pinned bottom buttons — Google sign-in (white) and guest (dark surface).
 */
export function OnboardingScreen({ onGoogle, onGuest, busy = false, error = null }: OnboardingScreenProps) {
  const tr = useT();

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.heroWrap} pointerEvents="none">
        <View style={styles.heroOffset}>
          <BrandHero />
        </View>
      </View>

      <View style={styles.footer}>
        {error != null && (
          <ThemedText weight="medium" size={typography.caption} color={colors.accent} style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={onGoogle}
          disabled={busy}
          style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <ThemedText weight="bold" size={typography.button} color={colors.onAccent}>
              {tr('onboardingGoogle')}
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={onGuest}
          disabled={busy}
          style={({ pressed }) => [styles.button, styles.guestButton, pressed && styles.pressed]}
        >
          <ThemedText weight="bold" size={typography.button} color={colors.textPrimary}>
            {tr('onboardingGuest')}
          </ThemedText>
        </Pressable>

        <ThemedText weight="light" size={typography.micro} color={colors.textSecondary} style={styles.note}>
          {tr('guestSyncNote')}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'flex-end',
  },
  // Absolute-fill so the hero sits exactly where the splash one does.
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOffset: {
    transform: [{ translateY: -40 }],
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  button: {
    height: 54,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: colors.textPrimary,
  },
  guestButton: {
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.85,
  },
  error: {
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
