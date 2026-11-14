import { useCallback, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  toggleTheme,
  type Theme,
} from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const set = useCallback((next: Theme) => {
    applyTheme(next);
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme((cur) => toggleTheme(cur));
  }, []);

  return { theme, setTheme: set, toggleTheme: toggle };
}
