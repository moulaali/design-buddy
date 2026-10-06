import { state } from './state.js';
import { hitShape, isBox } from './shapes/registry.js';
import { arrowPoints } from './shapes/arrow.js';
import { contains, rectDistance } from './geometry.js';

export function hitTest(p) {
    const tol = 6 / state.camera.zoom;
    for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (hitShape(s, p, tol)) return s;
    }
    return null;
}

export function boxAt(p, excludeId) {
    for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (isBox(s) && s.id !== excludeId && contains(s, p)) return s;
    }
    return null;
}

export function boxNear(p, tol, excludeId) {
    const inside = boxAt(p, excludeId);
    if (inside) return inside;
    let best = null, bestD = tol;
    for (const s of state.shapes) {
        if (!isBox(s) || s.id === excludeId) continue;
        const d = rectDistance(s, p);
        if (d <= bestD) { best = s; bestD = d; }
    }
    return best;
}

export function addShape(s) {
    state.shapes.push(s);
    state.selectedIds = new Set([s.id]);
    return s;
}

export function removeShapes(ids) {
    for (const s of state.shapes) {
        if (s.type !== 'arrow' || ids.has(s.id)) continue;
        if (ids.has(s.startId) || ids.has(s.endId)) {
            const { start, end } = arrowPoints(s);
            if (ids.has(s.startId)) { s.x1 = start.x; s.y1 = start.y; s.startId = null; }
            if (ids.has(s.endId)) { s.x2 = end.x; s.y2 = end.y; s.endId = null; }
        }
    }
    state.shapes = state.shapes.filter(s => !ids.has(s.id));
    ids.forEach(id => state.selectedIds.delete(id));
}
