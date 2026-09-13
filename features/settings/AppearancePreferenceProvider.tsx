import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  DEFAULT_APP_PREFERENCES,
  type AppearancePreference,
  withAppearancePreference,
} from '@/features/settings/appPreferences';
import {
  readAppPreferences,
  writeAppPreferences,
} from '@/services/storage/appPreferencesStorage';

type AppearancePreferenceContextValue = {
  appearance: AppearancePreference;
  setAppearance: (appearance: AppearancePreference) => void;
};

const AppearancePreferenceContext = createContext<AppearancePreferenceContextValue | null>(null);

type AppearancePreferenceProviderProps = {
  children: ReactNode;
};

export function AppearancePreferenceProvider({ children }: AppearancePreferenceProviderProps) {
  const [appearance, setAppearanceState] = useState<AppearancePreference>(
    () => readAppPreferences().appearance,
  );

  const setAppearance = useCallback((nextAppearance: AppearancePreference) => {
    const currentPreferences = readAppPreferences();
    writeAppPreferences(withAppearancePreference(currentPreferences, nextAppearance));
    setAppearanceState(nextAppearance);
  }, []);

  const value = useMemo(
    () => ({ appearance, setAppearance }),
    [appearance, setAppearance],
  );

  return (
    <AppearancePreferenceContext.Provider value={value}>
      {children}
    </AppearancePreferenceContext.Provider>
  );
}

export function useAppearancePreference() {
  return useContext(AppearancePreferenceContext)?.appearance ?? DEFAULT_APP_PREFERENCES.appearance;
}

export function useAppearancePreferenceSettings() {
  const context = useContext(AppearancePreferenceContext);
  if (!context) {
    throw new Error('useAppearancePreferenceSettings must be used within AppearancePreferenceProvider');
  }
  return context;
}
