import { createContext, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'knowledge-base-theme';

const SYSTEM_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

type ThemeContextValue = {
  effectiveTheme: EffectiveTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
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
  if (!storage) return 'system';

  const storedPreference = storage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : 'system';
}

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia(SYSTEM_THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyThemeToDocument(theme: EffectiveTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredThemePreference());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveEffectiveTheme(readStoredThemePreference()));

  useLayoutEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    const storage = getThemeStorage();

    setEffectiveTheme(resolveEffectiveTheme(preference));

    if (preference === 'system') {
      storage?.removeItem(THEME_STORAGE_KEY);
      return;
    }

    storage?.setItem(THEME_STORAGE_KEY, preference);
  }, [preference]);

  const handleSystemThemeChange = useEffectEvent((event: MediaQueryListEvent) => {
    setEffectiveTheme(event.matches ? 'dark' : 'light');
  });

  useEffect(() => {
    if (preference !== 'system' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA_QUERY);
    setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [handleSystemThemeChange, preference]);

  const value = useMemo<ThemeContextValue>(() => ({
    effectiveTheme,
    preference,
    setPreference: setPreferenceState,
    toggleTheme: () => {
      setPreferenceState((current) => {
        const currentTheme = current === 'system' ? getSystemTheme() : current;
        return currentTheme === 'dark' ? 'light' : 'dark';
      });
    },
  }), [effectiveTheme, preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
