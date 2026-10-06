import { state, getShape } from './state.js';
import { isBox } from './shapes/registry.js';
import { arrowPoints } from './shapes/arrow.js';
import { boxAt, boxNear } from './scene.js';
import { rectDistance } from './geometry.js';
import {
    ATTACH_TOL,
    MAGNET_STRENGTH, MAGNET_RADIUS_PX, MAGNET_HOLD
} from './config.js';

export const allBoxes = () => state.shapes.filter(isBox);
export const allArrows = () => state.shapes.filter(s => s.type === 'arrow');

export function magnetRadius() {
    const zoom = state.camera?.zoom || 1;
    return (MAGNET_RADIUS_PX * MAGNET_STRENGTH) / zoom;
}

export function magnetTarget(p, currentId, excludeId) {
    const radius = magnetRadius();
    if (radius <= 0) return boxAt(p, excludeId)?.id ?? null;
    const current = currentId && currentId !== excludeId ? getShape(currentId) : null;
    if (current && rectDistance(current, p) <= radius * MAGNET_HOLD) return current.id;
    return boxNear(p, radius, excludeId)?.id ?? null;
}

export function syncArrowCoords(a) {
    const { start, end } = arrowPoints(a);
    a.x1 = start.x;
    a.y1 = start.y;
    a.x2 = end.x;
    a.y2 = end.y;
}

export function targetBox(boxes, point, excludeId, customTol) {
    const tol = customTol ?? Math.max(ATTACH_TOL, magnetRadius());
    let best = null, bestD = tol;
    for (const b of boxes) {
        if (b.id === excludeId) continue;
        const d = rectDistance(b, point);
        if (d <= bestD) {
            best = b;
            bestD = d;
        }
    }
    return best;
}

export function attachLooseEnds(arrows, boxes, customTol) {
    let changed = false;
    for (const a of arrows) {
        if (a.startId && a.endId) continue;
        const { start, end } = arrowPoints(a);
        if (!a.startId) {
            const b = targetBox(boxes, start, a.endId, customTol);
            if (b) {
                a.startId = b.id;
                changed = true;
            }
        }
        if (!a.endId) {
            const b = targetBox(boxes, end, a.startId, customTol);
            if (b) {
                a.endId = b.id;
                changed = true;
            }
        }
        if (changed) syncArrowCoords(a);
    }
    return changed;
}

export function resolveDangling(arrows, boxes) {
    const tol = Math.max(ATTACH_TOL * 1.5, magnetRadius() * 1.5);
    return attachLooseEnds(arrows, boxes, tol);
}

