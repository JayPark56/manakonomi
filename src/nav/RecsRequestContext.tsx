import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Tab routes (used for typed cross-tab navigation). */
export type RootTabParamList = {
  search: undefined;
  library: undefined;
  forYou: undefined;
};

interface RecsRequestValue {
  /** A manga id the user asked to see recommendations for, or null. */
  pendingId: number | null;
  /** Request recommendations for a manga (e.g. from a Library tap). */
  requestRecs: (mangaId: number) => void;
  /** Clear the pending request once the Search tab has consumed it. */
  clearRequest: () => void;
}

const RecsRequestContext = createContext<RecsRequestValue | null>(null);

/**
 * Lets the Library tab ask the Search tab to open a manga's recommendations.
 * Library sets a pending id + navigates to the Search tab; SearchTab consumes
 * the id, seeds its drill-down stack, and clears it. Lives above the navigator
 * so both tabs share it.
 */
export function RecsRequestProvider({ children }: { children: ReactNode }) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const requestRecs = useCallback((mangaId: number) => setPendingId(mangaId), []);
  const clearRequest = useCallback(() => setPendingId(null), []);
  const value = useMemo(
    () => ({ pendingId, requestRecs, clearRequest }),
    [pendingId, requestRecs, clearRequest],
  );
  return <RecsRequestContext.Provider value={value}>{children}</RecsRequestContext.Provider>;
}

export function useRecsRequest(): RecsRequestValue {
  const ctx = useContext(RecsRequestContext);
  if (!ctx) throw new Error('useRecsRequest must be used inside RecsRequestProvider');
  return ctx;
}
