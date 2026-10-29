import { runtime } from '../platform.ts';
import { resetAll } from '../lib/prefs/resetAll.ts';

export function createSettingsPane() {
  return {
    toggleGrid() {
      const visible = runtime.storage.get('gridVisible') !== 'true';
      runtime.storage.set('gridVisible', String(visible));
      return visible;
    },
    setTheme(theme: 'light' | 'dark') {
      runtime.storage.set('theme', theme);
    },
    resetPreferences() {
      resetAll(runtime.storage, () => runtime.reload());
    },
  };
}
