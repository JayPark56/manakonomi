import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { Manga } from '../api/anilist';
import type { TcgCard } from '../tcg/optcgApi';
import type { UnionArenaCard } from '../tcg/unionArenaApi';
import type { CardGame } from '../tcg/mangaCardGames';
import { useRecsRequest, type RootTabParamList } from '../nav/RecsRequestContext';
import { SearchScreen } from './SearchScreen';
import { RecommendationsScreen } from './RecommendationsScreen';
import { TcgCardListScreen } from './TcgCardListScreen';
import { TcgCardDetailScreen } from './TcgCardDetailScreen';
import { UnionArenaCardListScreen } from './UnionArenaCardListScreen';
import { UnionArenaCardDetailScreen } from './UnionArenaCardDetailScreen';
import { colors } from '../theme';

// Card-game browser overlay state, discriminated by which game is open.
type TcgNav =
  | { game: 'optcg'; view: 'list'; initialSetId?: string }
  | { game: 'optcg'; view: 'detail'; card: TcgCard }
  | { game: 'union-arena'; view: 'list' }
  | { game: 'union-arena'; view: 'detail'; card: UnionArenaCard };

/**
 * Search flow: search (with a multi-select set) → recommendations with a
 * drill-down history stack. Each stack entry is the id set shown — a single
 * id for normal taps, several for combined recommendations.
 */
export function SearchTab() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [stack, setStack] = useState<number[][]>([]);
  const [selection, setSelection] = useState<Manga[]>([]);
  // Card-game browser overlay, opened from a linked manga's recommendations.
  const [tcg, setTcg] = useState<TcgNav | null>(null);
  // True when the current recs session was opened from the Library tab, so
  // backing out of the last recs screen returns there instead of to search.
  const [fromLibrary, setFromLibrary] = useState(false);
  const current = stack.length > 0 ? stack[stack.length - 1] : null;

  // Clear the Library-origin latch whenever this tab is left by other means
  // (e.g. tapping a tab in the bar), so a later manual return + Back doesn't
  // bounce to Library. The next real Library tap re-sets it via pendingId.
  useEffect(() => navigation.addListener('blur', () => setFromLibrary(false)), [navigation]);

  // A Library tap (other tab) requests this manga's recommendations: seed the
  // stack as a fresh single-source drill-down, exactly like a search result.
  const { pendingId, clearRequest } = useRecsRequest();
  useEffect(() => {
    if (pendingId == null) return;
    setStack([[pendingId]]);
    setTcg(null);
    setFromLibrary(true);
    clearRequest();
  }, [pendingId, clearRequest]);

  // Back out of recs: pop the drill-down; at the root, return to Library if the
  // session started there, otherwise fall back to the search screen.
  const handleRecsBack = () => {
    if (stack.length <= 1 && fromLibrary) {
      setFromLibrary(false);
      setStack([]);
      navigation.navigate('library');
      return;
    }
    setStack((prev) => prev.slice(0, -1));
  };

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
          onSelect={(manga) => {
            setFromLibrary(false);
            setStack([[manga.id]]);
          }}
          selection={selection}
          onToggleSelection={toggleSelection}
          onClearSelection={() => setSelection([])}
          onGetRecommendations={() => {
            if (selection.length > 0) {
              setFromLibrary(false);
              setStack([selection.map((m) => m.id)]);
            }
          }}
        />
      </View>
      {current != null && tcg == null && (
        <View style={styles.screen}>
          <RecommendationsScreen
            key={current.join(',')}
            mangaIds={current}
            onSelectRecommendation={(manga) => setStack((prev) => [...prev, [manga.id]])}
            onBack={handleRecsBack}
            onOpenTcg={(game: CardGame) => setTcg({ game, view: 'list' })}
          />
        </View>
      )}
      {tcg != null && (
        <View style={styles.screen}>
          {tcg.game === 'optcg' ? (
            tcg.view === 'list' ? (
              <TcgCardListScreen
                initialSetId={tcg.initialSetId}
                onBack={() => setTcg(null)}
                onSelectCard={(card) => setTcg({ game: 'optcg', view: 'detail', card })}
              />
            ) : (
              <TcgCardDetailScreen
                card={tcg.card}
                // The list re-mounts on back; restore the card's own set so the
                // user returns to the set they were browsing (not the newest).
                onBack={() => setTcg({ game: 'optcg', view: 'list', initialSetId: tcg.card.setId })}
                onViewSet={(setId) => setTcg({ game: 'optcg', view: 'list', initialSetId: setId })}
              />
            )
          ) : tcg.view === 'list' ? (
            <UnionArenaCardListScreen
              onBack={() => setTcg(null)}
              onSelectCard={(card) => setTcg({ game: 'union-arena', view: 'detail', card })}
            />
          ) : (
            <UnionArenaCardDetailScreen
              card={tcg.card}
              onBack={() => setTcg({ game: 'union-arena', view: 'list' })}
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
