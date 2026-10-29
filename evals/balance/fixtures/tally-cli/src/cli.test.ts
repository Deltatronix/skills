import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatch } from './cli.ts';
import { createStore } from './store.ts';

test('add, report and export dispatch without process IO', () => {
  const store = createStore();
  assert.deepEqual(dispatch(['add', 'food', '2', '1.25'], store), ['Added 2 to food']);
  assert.deepEqual(dispatch(['report'], store), ['food: 2.50']);
  assert.deepEqual(dispatch(['export'], store), ['category,amount,unitPrice', 'food,2,1.25']);
  assert.throws(() => dispatch(['add', 'food', '0', '2'], store), /Amount must be positive/);
  assert.throws(() => dispatch(['unknown'], store), /Unknown command/);
  assert.deepEqual(dispatch(['export'], createStore()), []);
});
