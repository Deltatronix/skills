import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as app from '../src/main.ts';
import { parsePacket } from '../src/index.ts';

// Only app/SDK entries: internal helpers are free to disappear during a rebalance.
test('save button default, explicit enabled and disabled output', () => {
  assert.equal(app.renderSaveButton(), '<button>Save project</button>');
  assert.equal(app.renderSaveButton({}), '<button>Save project</button>');
  assert.equal(app.renderSaveButton({ disabled: false }), '<button>Save project</button>');
  assert.equal(app.renderSaveButton({ disabled: true }), '<button disabled>Save project</button>');
});

test('pane actions persist values, reset local keys and keep the signed-in account', () => {
  app.runtime.storage.clear();
  app.runtime.reloadCount = 0;
  app.runtime.storage.set('accountId', 'a-1');
  app.runtime.storage.set('lastProject', 'board-7');
  app.runtime.storage.set('unrelated', 'keep');
  const pane = app.createSettingsPane();
  assert.equal(pane.toggleGrid(), true);
  assert.equal(app.runtime.storage.get('gridVisible'), 'true');
  assert.equal(pane.toggleGrid(), false);
  assert.equal(app.runtime.storage.get('gridVisible'), 'false');
  pane.setTheme('dark');
  assert.equal(app.runtime.storage.get('theme'), 'dark');
  pane.setTheme('light');
  assert.equal(app.runtime.storage.get('theme'), 'light');
  assert.equal(app.runtime.reloadCount, 0);
  pane.resetPreferences();
  assert.deepEqual([...app.runtime.storage], [['accountId', 'a-1'], ['unrelated', 'keep']]);
  assert.equal(app.runtime.reloadCount, 1);
  pane.resetPreferences();
  assert.equal(app.runtime.reloadCount, 2);
});

const panels = [
  [app.createLayersPanel, [['layer.add', 'plus', 'Add layer'], ['layer.remove', 'minus', 'Remove layer']]],
  [app.createNetsPanel, [['net.add', 'wire', 'Add net'], ['net.inspect', 'search', 'Inspect net']]],
  [app.createPartsPanel, [['part.add', 'chip', 'Add part'], ['part.remove', 'trash', 'Remove part']]],
] as const;
for (const [create, definitions] of panels) {
  test(`${create.name}: ordered metadata, disabled and live dispatch`, () => {
    const calls: string[] = [];
    const registry = Object.fromEntries(definitions.map(([id], i) => [id, { enabled: i === 0, ...(i === 0 ? { shortcut: 'A' } : {}) }]));
    const panel = create(registry, (id) => calls.push(id));
    assert.deepEqual(panel.items.map(({ run, ...item }) => item), definitions.map(([id, icon, label], i) => ({ id, icon, label, shortcut: i === 0 ? 'A' : '', disabled: i !== 0 })));
    panel.items[0].run();
    panel.items[1].run();
    assert.deepEqual(calls, [definitions[0][0]]);
    registry[definitions[0][0]].enabled = false;
    registry[definitions[1][0]].enabled = true;
    panel.items[0].run();
    panel.items[1].run();
    assert.deepEqual(calls, [definitions[0][0], definitions[1][0]]);
  });
}

test('all four JSON callers preserve output, cloning and failure behavior', () => {
  for (const value of [{ title: 'a "board"', nested: { points: [1, null, 'é'] } }, [false, 0, ''], null, 17]) {
    const encoded = JSON.stringify(value);
    assert.equal(app.saveDocument(value), encoded);
    assert.deepEqual(app.loadDocument(encoded), value);
    assert.equal(app.exportProject(value), JSON.stringify({ version: 1, project: value }));
    assert.deepEqual(app.snapshot(value), value);
  }
  const input = { nested: { value: 3 } };
  const cloned = app.snapshot(input) as typeof input;
  assert.notEqual(cloned, input);
  assert.notEqual(cloned.nested, input.nested);
  cloned.nested.value = 9;
  assert.equal(input.nested.value, 3);
  assert.throws(() => app.loadDocument('{oops'), SyntaxError);
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  for (const fn of [app.saveDocument, app.exportProject, app.snapshot]) assert.throws(() => fn(cycle), TypeError);
});

test('purchase quantities and CSV emptiness retain different meanings', () => {
  for (const value of [0, -1, -0.5, NaN]) assert.throws(() => app.addPurchase(value), /Amount must be positive/);
  assert.equal(app.addPurchase(0.5), 'Purchased 0.5');
  assert.equal(app.addPurchase(2), 'Purchased 2');
  assert.equal(app.exportRows([]), '');
  assert.equal(app.exportRows(['']), 'value\n');
  assert.equal(app.exportRows(['a', 'b']), 'value\na\nb');
});

test('three arc callers keep the complete 32-segment geometry', () => {
  const arcs = [
    { cx: 1, cy: -2, radius: 7, startAngle: 0, endAngle: Math.PI / 2 },
    { cx: -4, cy: 9, radius: 2.5, startAngle: Math.PI * 2, endAngle: 0 },
    { cx: 3, cy: 6, radius: 0, startAngle: 1, endAngle: 1 },
  ];
  for (const arc of arcs) {
    const expected = Array.from({ length: 33 }, (_, i) => {
      const angle = arc.startAngle + (arc.endAngle - arc.startAngle) * i / 32;
      return { x: arc.cx + arc.radius * Math.cos(angle), y: arc.cy + arc.radius * Math.sin(angle) };
    });
    assert.deepEqual(app.arcPreview(arc), expected);
    assert.equal(app.arcPath(arc), expected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' '));
    assert.deepEqual(app.arcBounds(arc), {
      minX: Math.min(...expected.map((p) => p.x)), minY: Math.min(...expected.map((p) => p.y)),
      maxX: Math.max(...expected.map((p) => p.x)), maxY: Math.max(...expected.map((p) => p.y)),
    });
  }
});

test('all five money callers preserve default and compact variation', () => {
  for (const [cents, standard, compact] of [
    [0, '$0.00', '$0.00'], [12345, '$123.45', '$123.45'],
    [100000, '$1000.00', '$1.0k'], [125000, '$1250.00', '$1.3k'],
    [-125000, '-$1250.00', '-$1.3k'],
  ] as const) {
    assert.equal(app.invoiceTotal(cents), `Invoice: ${standard}`);
    assert.equal(app.cartTotal(cents), `Cart: ${standard}`);
    assert.equal(app.receiptTotal(cents), `Paid: ${standard}`);
    assert.equal(app.priceTag(cents), compact);
    assert.equal(app.accountSummary(cents), `Balance: ${compact}`);
  }
});

for (const create of [app.createLineTool, app.createTrackTool]) {
  test(`${create.name}: complete chain, duplicates, isolation, input ownership and cancel`, () => {
    const tool = create();
    const other = create();
    assert.equal(tool.preview, null);
    tool.move({ x: 4, y: 5 });
    assert.equal(tool.preview, null);
    tool.finish();
    assert.deepEqual(tool.shapes, []);
    const first = { x: 1, y: 2 };
    assert.equal(tool.click(first), true);
    first.x = 999;
    assert.deepEqual(tool.preview, [{ x: 1, y: 2 }]);
    assert.equal(other.preview, null);
    tool.move({ x: 7, y: 9 });
    assert.deepEqual(tool.preview, [{ x: 1, y: 2 }, { x: 7, y: 9 }]);
    tool.click({ x: 1, y: 2 });
    assert.deepEqual(tool.preview, [{ x: 1, y: 2 }]);
    tool.click({ x: 10, y: 11 });
    tool.click({ x: 20, y: 12 });
    tool.finish();
    assert.deepEqual(tool.shapes[0].points, [{ x: 1, y: 2 }, { x: 10, y: 11 }, { x: 20, y: 12 }]);
    assert.equal(tool.shapes[0].closed, false);
    assert.equal(tool.preview, null);
    tool.click({ x: 30, y: 40 });
    tool.finish();
    assert.equal(tool.shapes.length, 1, 'one point does not commit');
    tool.click({ x: 30, y: 40 });
    tool.move({ x: 50, y: 60 });
    tool.cancel();
    assert.equal(tool.preview, null);
    assert.equal(tool.shapes.length, 1);
    tool.click({ x: 4, y: 5 });
    tool.click({ x: 8, y: 9 });
    tool.finish();
    assert.equal(tool.shapes.length, 2);
    assert.deepEqual(other.shapes, []);
  });
}

test('track keeps net inheritance, clearance boundary, configuration and reset semantics', () => {
  const pads = [{ at: { x: 0, y: 0 }, net: 'VCC' }, { at: { x: 20, y: 0 }, net: 'GND' }, { at: { x: 10, y: 10 }, net: 'VCC' }];
  const tool = app.createTrackTool({ pads });
  assert.equal(tool.click({ x: 2, y: 1 }), true);
  assert.deepEqual(tool.preview, [{ x: 0, y: 0 }]);
  assert.equal(tool.click({ x: 17, y: 0 }), false, 'clearance boundary is inclusive');
  assert.deepEqual(tool.preview, [{ x: 0, y: 0 }]);
  tool.move({ x: 10, y: 5 });
  assert.deepEqual(tool.preview, [{ x: 0, y: 0 }, { x: 10, y: 5 }]);
  assert.equal(tool.click({ x: 10, y: 10 }), true, 'same-net pad is allowed');
  tool.finish();
  assert.deepEqual(tool.shapes[0], { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], closed: false, net: 'VCC' });
  tool.click({ x: 20, y: 0 });
  assert.equal(tool.click({ x: 2, y: 0 }), false, 'next chain inherits GND');
  tool.cancel();
  tool.click({ x: 40, y: 40 });
  assert.equal(tool.click({ x: 20, y: 0 }), true, 'bare track has no clearance restriction');
  tool.finish();
  assert.equal(tool.shapes[1].net, null);
  const wide = app.createTrackTool({ pads, clearance: 8 });
  wide.click({ x: 0, y: 0 });
  assert.equal(wide.click({ x: 13, y: 0 }), false);
  assert.equal(wide.click({ x: 11, y: 0 }), true);
});

test('public SDK export remains usable by external callers', () => {
  for (const [text, expected] of [
    ['PING:', { kind: 'PING', payload: '' }], ['DATA:a:b:c', { kind: 'DATA', payload: 'a:b:c' }],
    [' raw : payload ', { kind: ' raw ', payload: ' payload ' }],
  ] as const) assert.deepEqual(parsePacket(text), expected);
  for (const text of ['', 'PING', ':payload']) assert.throws(() => parsePacket(text), /Invalid packet/);
});
