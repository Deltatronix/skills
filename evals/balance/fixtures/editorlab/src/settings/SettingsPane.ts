export interface PreferenceStorage {
  get(key: string): string | undefined;
  set(key: string, value: string): unknown;
  delete(key: string): unknown;
}

export function createSettingsPane({ storage, reload }: { storage: PreferenceStorage; reload: () => void }) {
  return {
    toggleGrid() {
      const visible = storage.get('gridVisible') !== 'true';
      storage.set('gridVisible', String(visible));
      return visible;
    },
    setTheme(theme: 'light' | 'dark') {
      storage.set('theme', theme);
    },
  };
}
