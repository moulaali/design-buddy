import { state, getShape } from '../state.js';
import { isResizable } from '../shapes/registry.js';
import { arrowPoints } from '../shapes/arrow.js';

export function handleCorners(s) {
    const pad = 4 / state.camera.zoom;
    return [
        { x: s.x - pad, y: s.y - pad, ax: s.x + s.w, ay: s.y + s.h, cursor: 'nwse-resize' },
        { x: s.x + s.w + pad, y: s.y - pad, ax: s.x, ay: s.y + s.h, cursor: 'nesw-resize' },
        { x: s.x - pad, y: s.y + s.h + pad, ax: s.x + s.w, ay: s.y, cursor: 'nesw-resize' },
        { x: s.x + s.w + pad, y: s.y + s.h + pad, ax: s.x, ay: s.y, cursor: 'nwse-resize' }
    ];
}

export function handleAt(p) {
    if (state.selectedIds.size !== 1) return null;
    const s = getShape([...state.selectedIds][0]);
    if (!s) return null;
    const r = 8 / state.camera.zoom;
    if (s.type === 'arrow') {
        const { start, end } = arrowPoints(s);
        if (Math.hypot(p.x - end.x, p.y - end.y) <= r) return { kind: 'arrow-end', id: s.id, which: 'end', cursor: 'move' };
        if (Math.hypot(p.x - start.x, p.y - start.y) <= r) return { kind: 'arrow-end', id: s.id, which: 'start', cursor: 'move' };
        return null;
    }
    if (!isResizable(s)) return null;
    for (const c of handleCorners(s)) {
        if (Math.abs(p.x - c.x) <= r && Math.abs(p.y - c.y) <= r) {
            return { kind: 'resize', id: s.id, ax: c.ax, ay: c.ay, ratio: s.w / s.h, cursor: c.cursor };
        }
    }
    return null;
}
