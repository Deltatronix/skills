import { DEVICE_KEYS } from './deviceKeys.ts';

export interface ResetStorage {
  delete(key: string): unknown;
}

export function resetAll(storage: ResetStorage, reload: () => void): void {
  for (const key of DEVICE_KEYS) {
    storage.delete(key);
  }
  reload();
}
