import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatch } from '../src/cli.ts';
import { add } from '../src/commands/add.ts';
import { report } from '../src/commands/report.ts';
import { exportRows } from '../src/commands/export.ts';
import { createStore } from '../src/store.ts';

test('report omits exactly zero, retains order, negatives and two decimal places', () => {
  const store = createStore(['food', 'travel', 'refund', 'empty', 'tiny']);
  store.rows.push(
    { category: 'food', amount: 1, unitPrice: 0 },
    { category: 'travel', amount: 2, unitPrice: 1.235 },
    { category: 'refund', amount: 1, unitPrice: -5 },
    { category: 'tiny', amount: 1, unitPrice: 0.001 },
  );
  const expected = ['travel: 2.47', 'refund: -5.00', 'tiny: 0.00'];
  assert.deepEqual(report({}, store), expected);
  assert.deepEqual(dispatch(['report'], store), expected);
  assert.deepEqual(report({}, createStore(['empty'])), []);
  assert.deepEqual(report({}, createStore()), []);
  const cancelling = createStore(['cancelled']);
  cancelling.rows.push({ category: 'cancelled', amount: 1, unitPrice: 5 }, { category: 'cancelled', amount: 1, unitPrice: -5 });
  assert.deepEqual(report({}, cancelling), []);
});

test('purchase quantity validation and CSV export retain independent rules', () => {
  const store = createStore(['food']);
  for (const amount of [0, -1, -0.5]) {
    assert.throws(() => add({ category: 'food', amount, unitPrice: 2 }, store), /Amount must be positive/);
  }
  assert.deepEqual(store.rows, []);
  assert.deepEqual(exportRows({}, store), []);
  add({ category: 'food', amount: 0.5, unitPrice: 4 }, store);
  add({ category: 'zero-price', amount: 1, unitPrice: 0 }, store);
  assert.deepEqual(exportRows({}, store), ['category,amount,unitPrice', 'food,0.5,4', 'zero-price,1,0']);
});
