import type { PreferenceStorage } from './settings/SettingsPane.ts';

export function createWorkspace(storage: PreferenceStorage) {
  return {
    openProject(id: string) { storage.set('lastProject', id); },
    get state() {
      return {
        theme: storage.get('theme') ?? 'light',
        gridVisible: storage.get('gridVisible') === 'true',
        lastProject: storage.get('lastProject') ?? null,
        accountId: storage.get('accountId') ?? null,
      };
    },
  };
}
