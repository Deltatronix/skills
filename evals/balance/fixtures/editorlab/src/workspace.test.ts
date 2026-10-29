import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace } from './workspace.ts';
import { createSettingsPane } from './settings/SettingsPane.ts';

test('workspace restores preferences written by settings and keeps account identity', () => {
  const storage = new Map([['accountId', 'a-1']]);
  const workspace = createWorkspace(storage);
  const pane = createSettingsPane({ storage, reload() {} });
  assert.deepEqual(workspace.state, { theme: 'light', gridVisible: false, lastProject: null, accountId: 'a-1' });
  pane.setTheme('dark');
  pane.toggleGrid();
  workspace.openProject('board-1');
  assert.deepEqual(workspace.state, { theme: 'dark', gridVisible: true, lastProject: 'board-1', accountId: 'a-1' });
});
