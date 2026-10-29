import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoardEditor } from './board/BoardEditor.ts';
import { createSchematicEditor } from './schematic/SchematicEditor.ts';
import { createSymbolEditor } from './symbol/SymbolEditor.ts';

for (const create of [createBoardEditor, createSchematicEditor, createSymbolEditor]) {
  test(`${create.name}: move, release, cancel and unrelated events`, () => {
    const editor = create();
    assert.equal(editor.pointerDown({ pointerId: 1, x: 2, y: 3 }), true);
    editor.pointerMove({ pointerId: 1, x: 5, y: 7 });
    assert.deepEqual(editor.active[0].to, { x: 5, y: 7 });
    assert.equal(editor.pointerUp({ pointerId: 2, x: 9, y: 9 }), false);
    assert.equal(editor.pointerUp({ pointerId: 1, x: 8, y: 9 }), true);
    assert.deepEqual(editor.shapes[0], { kind: editor.kind, pointerId: 1, from: { x: 2, y: 3 }, to: { x: 8, y: 9 } });
    editor.pointerDown({ pointerId: 3, x: 0, y: 0 });
    editor.cancel(3);
    assert.equal(editor.active.length, 0);
    assert.equal(editor.shapes.length, 1);
  });
}
