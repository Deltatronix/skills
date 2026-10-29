import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as app from './main.ts';

test('save button and persisted settings', () => {
  assert.equal(app.renderSaveButton(), '<button>Save project</button>');
  assert.equal(app.renderSaveButton({ disabled: true }), '<button disabled>Save project</button>');
  app.runtime.storage.clear();
  app.runtime.reloadCount = 0;
  app.runtime.storage.set('accountId', 'account');
  app.runtime.storage.set('lastProject', 'p');
  const pane = app.createSettingsPane();
  assert.equal(pane.toggleGrid(), true);
  pane.setTheme('dark');
  pane.resetPreferences();
  assert.deepEqual([...app.runtime.storage], [['accountId', 'account']]);
  assert.equal(app.runtime.reloadCount, 1);
});

test('JSON callers, independent quantities and CSV rows', () => {
  const doc = { title: 'board', points: [1, 2] };
  assert.equal(app.saveDocument(doc), JSON.stringify(doc));
  assert.deepEqual(app.loadDocument(app.saveDocument(doc)), doc);
  assert.equal(app.exportProject(doc), JSON.stringify({ version: 1, project: doc }));
  assert.deepEqual(app.snapshot(doc), doc);
  assert.throws(() => app.loadDocument('{'), SyntaxError);
  assert.equal(app.addPurchase(2), 'Purchased 2');
  assert.throws(() => app.addPurchase(0), /Amount must be positive/);
  assert.equal(app.exportRows([]), '');
  assert.equal(app.exportRows(['a']), 'value\na');
});

test('all money callers and all arc consumers', () => {
  assert.equal(app.invoiceTotal(12345), 'Invoice: $123.45');
  assert.equal(app.cartTotal(12345), 'Cart: $123.45');
  assert.equal(app.receiptTotal(-12345), 'Paid: -$123.45');
  assert.equal(app.priceTag(123450), '$1.2k');
  assert.equal(app.accountSummary(123450), 'Balance: $1.2k');
  const arc = { cx: 1, cy: 2, radius: 4, startAngle: 0, endAngle: Math.PI / 2 };
  assert.equal(app.arcPreview(arc).length, 33);
  assert.deepEqual(app.arcPreview(arc)[0], { x: 5, y: 2 });
  assert.equal(app.arcPath(arc).split(' ').length, 33);
  assert.deepEqual(app.arcBounds(arc), { minX: 1.0000000000000002, minY: 2, maxX: 5, maxY: 6 });
});
