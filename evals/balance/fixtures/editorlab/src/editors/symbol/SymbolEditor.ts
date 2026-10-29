import { createDragSession, type Drag } from '../../shared/dragSession.ts';

export function createSymbolEditor() {
  const shapes: (Drag & { kind: string })[] = [];
  const session = createDragSession({ onCommit: (drag) => shapes.push({ kind: 'symbol', ...drag }) });
  return {
    kind: 'symbol',
    pointerDown: session.pointerDown,
    pointerMove: session.pointerMove,
    pointerUp: session.pointerUp,
    cancel: session.cancel,
    get active() { return session.active; },
    get shapes() { return shapes; },
  };
}
