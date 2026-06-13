import { Pressable, StyleSheet, View } from 'react-native';
import { type Language } from '../i18n/i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemedText } from './ThemedText';
import { colors, spacing, typography } from '../theme';

// Display order Korean → Japanese → English; each label is FIXED in its own
// script regardless of the currently selected language.
const SEGMENTS: { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <View style={styles.container}>
      {SEGMENTS.map(({ code, label }) => {
        const selected = code === lang;
        return (
          <Pressable
            key={code}
            onPress={() => setLang(code)}
            style={[styles.segment, selected && styles.segmentSelected]}
            hitSlop={4}
          >
            <ThemedText
              weight={selected ? 'semiBold' : 'medium'}
              size={typography.caption}
              color={selected ? colors.onAccent : colors.textSecondary}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  segment: {
    // Compact horizontal padding so the three native-script labels fit beside
    // the header title even for the long English brand at 375px.
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
});
