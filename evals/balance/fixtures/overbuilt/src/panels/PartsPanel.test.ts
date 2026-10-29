import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPartsPanel } from './PartsPanel.ts';

test('parts panel maps all rail item fields and dispatches enabled actions', () => {
  const calls: string[] = [];
  const registry = { 'part.add': { enabled: true, shortcut: 'A' }, 'part.remove': { enabled: false } };
  const panel = createPartsPanel(registry, (id) => calls.push(id));
  assert.equal(panel.items.length, 2);
  assert.equal(panel.items[0].id, 'part.add');
  assert.equal(panel.items[0].icon, 'chip');
  assert.equal(panel.items[0].label, 'Add part');
  assert.equal(panel.items[0].shortcut, 'A');
  assert.equal(panel.items[0].disabled, false);
  assert.equal(panel.items[1].id, 'part.remove');
  assert.equal(panel.items[1].icon, 'trash');
  assert.equal(panel.items[1].label, 'Remove part');
  assert.equal(panel.items[1].shortcut, '');
  assert.equal(panel.items[1].disabled, true);
  panel.items[0].run();
  panel.items[1].run();
  assert.deepEqual(calls, ['part.add']);
});
