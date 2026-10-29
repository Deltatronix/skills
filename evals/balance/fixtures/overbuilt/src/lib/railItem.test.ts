import { test } from 'node:test';
import assert from 'node:assert/strict';
import { railItemFor } from './railItem.ts';

test('rail items map metadata and dispatch enabled actions only', () => {
  const calls: string[] = [];
  const registry = { a: { enabled: true, shortcut: 'A' }, b: { enabled: false } };
  const a = railItemFor(registry, (id) => calls.push(id), 'a', 'plus', 'Add');
  const b = railItemFor(registry, (id) => calls.push(id), 'b', 'minus', 'Remove');
  assert.deepEqual({ ...a, run: null }, { id: 'a', icon: 'plus', label: 'Add', shortcut: 'A', disabled: false, run: null });
  assert.deepEqual({ ...b, run: null }, { id: 'b', icon: 'minus', label: 'Remove', shortcut: '', disabled: true, run: null });
  a.run();
  b.run();
  assert.deepEqual(calls, ['a']);
  registry.b.enabled = true;
  b.run();
  assert.deepEqual(calls, ['a', 'b']);
});
