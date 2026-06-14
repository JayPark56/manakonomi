import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CardCollectionHeart } from '../cards/CardCollectionHeart';
import { ThemedText } from '../components/ThemedText';
import { useT } from '../i18n/LanguageContext';
import type { UnionArenaCard } from '../tcg/unionArenaApi';
import { colors, radius, spacing, typography } from '../theme';

export function UnionArenaCardDetailScreen({
  card,
  onBack,
}: {
  card: UnionArenaCard;
  onBack: () => void;
}) {
  const tr = useT();
  const effect = card.effect.trim();
  const trigger = card.trigger.trim();

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

        <View style={styles.nameRow}>
          <ThemedText weight="bold" size={typography.source} style={styles.name}>
            {card.name}
          </ThemedText>
          <CardCollectionHeart game="union-arena" card={card} size={26} />
        </View>
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} style={styles.cardId}>
          {card.code}
        </ThemedText>

        <View style={styles.facts}>
          <Fact label={tr('tcgRarityLabel')} value={card.rarity} />
          <Fact label={tr('tcgTypeLabel')} value={card.type} />
        </View>

        {/* No price in this source — the effect/trigger rules text is the detail. */}
        {effect.length > 0 && (
          <View style={styles.textBlock}>
            <ThemedText weight="medium" size={typography.micro} color={colors.textSecondary}>
              {tr('uaEffectLabel')}
            </ThemedText>
            <ThemedText weight="regular" size={typography.label} style={styles.bodyText}>
              {effect}
            </ThemedText>
          </View>
        )}
        {trigger.length > 0 && (
          <View style={styles.textBlock}>
            <ThemedText weight="medium" size={typography.micro} color={colors.textSecondary}>
              {tr('uaTriggerLabel')}
            </ThemedText>
            <ThemedText weight="regular" size={typography.label} style={styles.bodyText}>
              {trigger}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  name: {
    flexShrink: 1,
  },
  cardId: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  facts: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  fact: {
    gap: 2,
  },
  textBlock: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  bodyText: {
    lineHeight: 20,
  },
});
