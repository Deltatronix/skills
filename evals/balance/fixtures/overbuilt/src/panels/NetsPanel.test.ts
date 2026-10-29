import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNetsPanel } from './NetsPanel.ts';

test('nets panel maps all rail item fields and dispatches enabled actions', () => {
  const calls: string[] = [];
  const registry = { 'net.add': { enabled: true, shortcut: 'A' }, 'net.inspect': { enabled: false } };
  const panel = createNetsPanel(registry, (id) => calls.push(id));
  assert.equal(panel.items.length, 2);
  assert.equal(panel.items[0].id, 'net.add');
  assert.equal(panel.items[0].icon, 'wire');
  assert.equal(panel.items[0].label, 'Add net');
  assert.equal(panel.items[0].shortcut, 'A');
  assert.equal(panel.items[0].disabled, false);
  assert.equal(panel.items[1].id, 'net.inspect');
  assert.equal(panel.items[1].icon, 'search');
  assert.equal(panel.items[1].label, 'Inspect net');
  assert.equal(panel.items[1].shortcut, '');
  assert.equal(panel.items[1].disabled, true);
  panel.items[0].run();
  panel.items[1].run();
  assert.deepEqual(calls, ['net.add']);
});
