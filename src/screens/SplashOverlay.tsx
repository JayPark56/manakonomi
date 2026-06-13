import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { BrandHero } from '../components/BrandHero';
import { colors } from '../theme';

const VISIBLE_MS = 1500;
const FADE_MS = 400;

/**
 * Full-screen black splash shown on every launch. Held by expo-splash-screen
 * until fonts load, then this React overlay paints (handing off with no white
 * flash) and fades out after ~1.5s, revealing the app underneath.
 */
export function SplashOverlay({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  // Read onDone via a ref so the one-shot timer effect never re-runs (and the
  // 1.5s window never restarts) if the parent passes a new callback identity.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDoneRef.current();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  // Hide the native splash only once this black overlay has painted, so the
  // two never expose a white frame between them.
  const handleLayout = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { opacity }]}
      pointerEvents="none"
      onLayout={handleLayout}
    >
      <View style={styles.hero}>
        <BrandHero />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    // Sit slightly above the vertical center.
    transform: [{ translateY: -40 }],
  },
});
