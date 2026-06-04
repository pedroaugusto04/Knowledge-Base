import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'knowledge-base-theme';

type ThemeContextValue = {
  effectiveTheme: EffectiveTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'dark' || value === 'light';
}

function getThemeStorage() {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;

  const storage = globalThis.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage;
}

function readStoredThemePreference(): ThemePreference {
  const storage = getThemeStorage();
  if (!storage) return 'dark';

  const storedPreference = storage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : 'dark';
}

function applyThemeToDocument(theme: EffectiveTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredThemePreference());

  useLayoutEffect(() => {
    applyThemeToDocument(preference);
  }, [preference]);

  useEffect(() => {
    const storage = getThemeStorage();
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    if (preference !== 'dark' || stored !== null) {
      storage?.setItem(THEME_STORAGE_KEY, preference);
    }
  }, [preference]);

  const value = useMemo<ThemeContextValue>(() => ({
    effectiveTheme: preference,
    preference,
    setPreference: setPreferenceState,
    toggleTheme: () => {
      setPreferenceState((current) => (current === 'dark' ? 'light' : 'dark'));
    },
  }), [preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
