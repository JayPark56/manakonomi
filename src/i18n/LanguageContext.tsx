import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { t, type Language, type StringKey } from './i18n';

const STORAGE_KEY = 'mangataste:language:v1';

function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  if (code === 'ko' || code === 'ja') return code;
  return 'en';
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Device language renders immediately; the persisted choice (if any)
  // replaces it as soon as AsyncStorage resolves — unless the user already
  // picked a language in the meantime (a tap must not be reverted by the
  // slower-resolving load).
  const [lang, setLangState] = useState<Language>(deviceLanguage);
  const userPicked = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!userPicked.current && (stored === 'en' || stored === 'ko' || stored === 'ja')) {
          setLangState(stored);
        }
      })
      .catch((err: unknown) => console.warn('[i18n] failed to load language:', err));
  }, []);

  const setLang = useCallback((next: Language) => {
    userPicked.current = true;
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err: unknown) =>
      console.warn('[i18n] failed to persist language:', err),
    );
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

/** Translator bound to the current language: tr('searchPlaceholder'). */
export function useT(): (key: StringKey) => string {
  const { lang } = useLanguage();
  return useCallback((key: StringKey) => t(key, lang), [lang]);
}
