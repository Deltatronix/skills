import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsPane } from './SettingsPane.ts';

test('grid and theme actions persist device preferences without reloading', () => {
  const storage = new Map<string, string>([['accountId', 'signed-in']]);
  let reloads = 0;
  const pane = createSettingsPane({ storage, reload: () => reloads++ });
  assert.equal(pane.toggleGrid(), true);
  assert.equal(pane.toggleGrid(), false);
  assert.equal(storage.get('gridVisible'), 'false');
  pane.setTheme('dark');
  assert.equal(storage.get('theme'), 'dark');
  assert.equal(storage.get('accountId'), 'signed-in');
  assert.equal(reloads, 0);
});
