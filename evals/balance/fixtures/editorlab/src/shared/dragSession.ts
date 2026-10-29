export interface PointerEvent {
  pointerId: number;
  x: number;
  y: number;
}

export interface Drag {
  pointerId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface DragSessionOptions {
  onCommit: (drag: Drag) => void;
}

export function createDragSession(options: DragSessionOptions) {
  const active = new Map<number, Drag>();
  return {
    pointerDown(event: PointerEvent): boolean {
      if (active.has(event.pointerId)) return false;
      active.set(event.pointerId, { pointerId: event.pointerId, from: { x: event.x, y: event.y }, to: { x: event.x, y: event.y } });
      return true;
    },
    pointerMove(event: PointerEvent) {
      const drag = active.get(event.pointerId);
      if (drag) drag.to = { x: event.x, y: event.y };
    },
    pointerUp(event: PointerEvent): boolean {
      const drag = active.get(event.pointerId);
      if (!drag) return false;
      drag.to = { x: event.x, y: event.y };
      active.delete(event.pointerId);
      options.onCommit(drag);
      return true;
    },
    cancel(pointerId: number) {
      active.delete(pointerId);
    },
    get active() {
      return [...active.values()];
    },
  };
}
