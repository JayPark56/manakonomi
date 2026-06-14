import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import { formatPrice, type TcgCard } from '../tcg/optcgApi';
import { colors, radius, spacing, typography } from '../theme';

export function TcgCardDetailScreen({ card, onBack }: { card: TcgCard; onBack: () => void }) {
  const tr = useT();

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.back}>
        {({ pressed }) => (
          <ThemedText weight="medium" size={typography.button} color={pressed ? colors.accent : colors.textPrimary}>
            ‹ {tr('back')}
          </ThemedText>
        )}
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        {card.image ? (
          <Image source={{ uri: card.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imageEmpty]} />
        )}

        <ThemedText weight="bold" size={typography.source} style={styles.name}>
          {card.name}
        </ThemedText>
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} style={styles.cardId}>
          {card.id}
        </ThemedText>

        <View style={styles.facts}>
          <Fact label={tr('tcgRarityLabel')} value={card.rarity} />
          <Fact label={tr('tcgTypeLabel')} value={card.type} />
          <Fact label={tr('tcgSetLabel')} value={`${card.setName} (${card.setId})`} />
        </View>

        {card.text != null && card.text.length > 0 && (
          <ThemedText weight="regular" size={typography.caption} color={colors.textSecondary} style={styles.cardText}>
            {card.text}
          </ThemedText>
        )}

        <View style={styles.priceBox}>
          <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
            {tr('tcgMarketPrice')}
          </ThemedText>
          <ThemedText weight="bold" size={typography.header} color={colors.accent}>
            {formatPrice(card.marketPrice)}
          </ThemedText>
          <ThemedText weight="light" size={typography.micro} color={colors.textSecondary}>
            {tr('tcgPriceFrom')}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

/** A label above a value, used for rarity / type / set rows. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <ThemedText weight="medium" size={typography.micro} color={colors.textSecondary}>
        {label}
      </ThemedText>
      <ThemedText weight="semiBold" size={typography.label}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  back: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '80%',
    maxWidth: 320,
    aspectRatio: 5 / 7,
    borderRadius: radius,
    backgroundColor: colors.card,
  },
  imageEmpty: {
    opacity: 0.4,
  },
  name: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  cardId: {
    marginTop: spacing.xs,
  },
  facts: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  fact: {
    gap: 2,
  },
  cardText: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  priceBox: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
});
