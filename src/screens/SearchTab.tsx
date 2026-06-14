import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Manga } from '../api/anilist';
import type { TcgCard } from '../tcg/optcgApi';
import { SearchScreen } from './SearchScreen';
import { RecommendationsScreen } from './RecommendationsScreen';
import { TcgCardListScreen } from './TcgCardListScreen';
import { TcgCardDetailScreen } from './TcgCardDetailScreen';
import { colors } from '../theme';

type TcgNav = { view: 'list'; initialSetId?: string } | { view: 'detail'; card: TcgCard };

/**
 * Search flow: search (with a multi-select set) → recommendations with a
 * drill-down history stack. Each stack entry is the id set shown — a single
 * id for normal taps, several for combined recommendations.
 */
export function SearchTab() {
  const [stack, setStack] = useState<number[][]>([]);
  const [selection, setSelection] = useState<Manga[]>([]);
  // Card-game browser overlay, opened from a linked manga's recommendations.
  const [tcg, setTcg] = useState<TcgNav | null>(null);
  const current = stack.length > 0 ? stack[stack.length - 1] : null;

  const toggleSelection = (manga: Manga) => {
    setSelection((prev) =>
      prev.some((m) => m.id === manga.id)
        ? prev.filter((m) => m.id !== manga.id)
        : [...prev, manga],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Search stays mounted so query/results/selection survive going back. */}
      <View style={[styles.screen, current != null && styles.hidden]}>
        <SearchScreen
          onSelect={(manga) => setStack([[manga.id]])}
          selection={selection}
          onToggleSelection={toggleSelection}
          onClearSelection={() => setSelection([])}
          onGetRecommendations={() => {
            if (selection.length > 0) setStack([selection.map((m) => m.id)]);
          }}
        />
      </View>
      {current != null && tcg == null && (
        <View style={styles.screen}>
          <RecommendationsScreen
            key={current.join(',')}
            mangaIds={current}
            onSelectRecommendation={(manga) => setStack((prev) => [...prev, [manga.id]])}
            onBack={() => setStack((prev) => prev.slice(0, -1))}
            onOpenTcg={() => setTcg({ view: 'list' })}
          />
        </View>
      )}
      {tcg != null && (
        <View style={styles.screen}>
          {tcg.view === 'list' ? (
            <TcgCardListScreen
              initialSetId={tcg.initialSetId}
              onBack={() => setTcg(null)}
              onSelectCard={(card) => setTcg({ view: 'detail', card })}
            />
          ) : (
            <TcgCardDetailScreen
              card={tcg.card}
              // The list re-mounts on back; restore the card's own set so the
              // user returns to the set they were browsing (not the newest).
              onBack={() => setTcg({ view: 'list', initialSetId: tcg.card.setId })}
              onViewSet={(setId) => setTcg({ view: 'list', initialSetId: setId })}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});
