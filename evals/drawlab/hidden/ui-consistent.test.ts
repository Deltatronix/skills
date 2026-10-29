import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSketchPage } from '../src/app/pages/sketch/SketchPage.ts';
import { createBoardPage } from '../src/app/pages/board/BoardPage.ts';
import { createFootprintPage } from '../src/app/pages/footprint/FootprintPage.ts';
import { createSchematicPage } from '../src/app/pages/schematic/SchematicPage.ts';

const pages: any = { sketch: createSketchPage(), board: createBoardPage(), footprint: createFootprintPage(), schematic: createSchematicPage() };
const lineButton = (p: any) => p.toolbar().find((b: any) => b.id === 'line');

test('footprint has a toolbar with the Line tool and a last-saved header', () => {
  assert.ok(lineButton(pages.footprint), 'footprint toolbar has a line button');
  assert.match(pages.footprint.header(new Date(2026, 8, 9)), /2026/);
  assert.match(pages.footprint.toolbarHtml(), /data-tool="line"/);
});

test('the Line tool button has the same icon, label and shortcut on sketch, board and footprint', () => {
  const s = lineButton(pages.sketch), b = lineButton(pages.board), f = lineButton(pages.footprint);
  assert.ok(s && b && f, JSON.stringify({ s, b, f }));
  assert.deepEqual([b.icon, b.label, b.shortcut], [s.icon, s.label, s.shortcut], 'board vs sketch');
  assert.deepEqual([f.icon, f.label, f.shortcut], [s.icon, s.label, s.shortcut], 'footprint vs sketch');
});

test('the last-saved header reads the same on every page', () => {
  const d = new Date(2026, 8, 9);
  const h = ['sketch', 'board', 'footprint', 'schematic'].map((k) => pages[k].header(d));
  assert.ok(h.every((x) => x === h[0]), JSON.stringify(h));
  assert.match(h[0], /09.09.2026/);
});
