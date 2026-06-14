import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { setIntroCompleted } from './introStorage';

interface IntroContextValue {
  visible: boolean;
  /** Show the intro from card 1 (help button + first-run). Does not touch the flag. */
  open: () => void;
  /** Close + persist intro:completed:v1 (Skip and Done both call this). */
  dismiss: () => void;
}

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const dismiss = useCallback(() => {
    setVisible(false);
    void setIntroCompleted();
  }, []);

  const value = useMemo(() => ({ visible, open, dismiss }), [visible, open, dismiss]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro(): IntroContextValue {
  const ctx = useContext(IntroContext);
  if (!ctx) throw new Error('useIntro must be used inside IntroProvider');
  return ctx;
}
