import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsPane } from '../src/settings/SettingsPane.ts';

test('reset removes only device preferences, then reloads exactly once', () => {
  const values = new Map([['theme', 'dark'], ['gridVisible', 'true'], ['lastProject', 'board-1'], ['accountId', 'account-7'], ['other', 'keep']]);
  const deleted: string[] = [];
  let reloads = 0;
  const storage = {
    get: (key: string) => values.get(key),
    set: (key: string, value: string) => values.set(key, value),
    delete(key: string) { deleted.push(key); return values.delete(key); },
  };
  const pane = createSettingsPane({ storage, reload() {
    reloads++;
    for (const key of ['theme', 'gridVisible', 'lastProject']) assert.equal(values.has(key), false, 'delete before reload');
    assert.equal(values.get('accountId'), 'account-7');
  } }) as ReturnType<typeof createSettingsPane> & { resetPreferences(): void };
  assert.equal(typeof pane.resetPreferences, 'function', 'the pane exposes the action');
  pane.resetPreferences();
  assert.deepEqual(deleted.sort(), ['gridVisible', 'lastProject', 'theme']);
  assert.deepEqual([...values], [['accountId', 'account-7'], ['other', 'keep']]);
  assert.equal(reloads, 1);
  pane.resetPreferences();
  assert.equal(reloads, 2, 'reset is safe when keys are already absent');
});

test('existing actions retain values, return values and no reload side effect', () => {
  const storage = new Map<string, string>([['accountId', 'account-8'], ['lastProject', 'p']]);
  let reloads = 0;
  const pane = createSettingsPane({ storage, reload: () => reloads++ });
  assert.equal(pane.toggleGrid(), true);
  assert.equal(storage.get('gridVisible'), 'true');
  assert.equal(pane.toggleGrid(), false);
  assert.equal(storage.get('gridVisible'), 'false');
  pane.setTheme('dark');
  assert.equal(storage.get('theme'), 'dark');
  pane.setTheme('light');
  assert.equal(storage.get('theme'), 'light');
  assert.equal(storage.get('lastProject'), 'p');
  assert.equal(storage.get('accountId'), 'account-8');
  assert.equal(reloads, 0);
});
