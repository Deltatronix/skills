import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoardEditor } from '../src/editors/board/BoardEditor.ts';
import { createSchematicEditor } from '../src/editors/schematic/SchematicEditor.ts';
import { createSymbolEditor } from '../src/editors/symbol/SymbolEditor.ts';

const event = (pointerId: number, x = 0, y = 0) => ({ pointerId, x, y });

test('schematic waits for the owning pointer release, then accepts a new drag', () => {
  const editor = createSchematicEditor();
  assert.equal(editor.pointerDown(event(1, 2, 3)), true);
  assert.equal(editor.pointerDown(event(2, 20, 30)), false);
  assert.equal(editor.pointerDown(event(1, 9, 9)), false);
  editor.pointerMove(event(2, 40, 50));
  assert.equal(editor.pointerUp(event(2)), false);
  assert.equal(editor.pointerDown(event(3)), false, 'an unrelated pointer release must not unlock');
  assert.equal(editor.active.length, 1);
  editor.pointerMove(event(1, 5, 6));
  assert.equal(editor.pointerUp(event(1, 7, 8)), true);
  assert.deepEqual(editor.shapes, [{ kind: 'schematic', pointerId: 1, from: { x: 2, y: 3 }, to: { x: 7, y: 8 } }]);
  assert.equal(editor.pointerDown(event(2)), true);
  editor.pointerUp(event(2, 10, 11));
  assert.equal(editor.shapes.length, 2);
});

test('cancel drops the wire but does not synthesize a release; guard is per editor', () => {
  const editor = createSchematicEditor();
  const other = createSchematicEditor();
  editor.pointerDown(event(1));
  editor.cancel(1);
  assert.equal(editor.active.length, 0);
  assert.equal(editor.pointerDown(event(2)), false);
  assert.equal(other.pointerDown(event(2)), true);
  editor.pointerUp(event(1));
  assert.equal(editor.pointerDown(event(2)), true);
  assert.equal(editor.shapes.length, 0);
});

for (const create of [createBoardEditor, createSymbolEditor]) {
  test(`${create.name}: concurrent drags remain independent`, () => {
    const editor = create();
    assert.equal(editor.pointerDown(event(1, 1, 2)), true);
    assert.equal(editor.pointerDown(event(2, 3, 4)), true);
    assert.equal(editor.active.length, 2);
    editor.pointerMove(event(1, 5, 6));
    editor.pointerUp(event(2, 7, 8));
    assert.equal(editor.active.length, 1);
    editor.pointerUp(event(1, 9, 10));
    assert.deepEqual(editor.shapes.map(({ pointerId, from, to }) => ({ pointerId, from, to })), [
      { pointerId: 2, from: { x: 3, y: 4 }, to: { x: 7, y: 8 } },
      { pointerId: 1, from: { x: 1, y: 2 }, to: { x: 9, y: 10 } },
    ]);
  });
}

for (const create of [createBoardEditor, createSchematicEditor, createSymbolEditor]) {
  test(`${create.name}: a single pointer still moves, commits and cancels`, () => {
    const editor = create();
    editor.pointerMove(event(99));
    assert.deepEqual(editor.active, []);
    editor.pointerDown(event(8, 1, 2));
    editor.pointerMove(event(8, 4, 5));
    assert.deepEqual(editor.active[0].to, { x: 4, y: 5 });
    editor.pointerUp(event(8, 6, 7));
    assert.deepEqual(editor.shapes[0].to, { x: 6, y: 7 });
    editor.pointerDown(event(9));
    editor.cancel(9);
    editor.pointerUp(event(9));
    assert.equal(editor.shapes.length, 1);
    assert.deepEqual(editor.active, []);
  });
}
