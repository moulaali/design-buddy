import { state, getShape, refresh } from '../state.js';
import { snapshot, finish } from '../history.js';
import { hitTest, addShape } from '../scene.js';
import { allArrows, allBoxes, attachLooseEnds, magnetTarget, syncArrowCoords } from '../bindings.js';
import { bounds, getDef, isEditable, moveShape } from '../shapes/registry.js';
import { makeText } from '../shapes/text.js';
import { normRect, rectsIntersect } from '../geometry.js';
import { highlightBindings, drawMarquee } from '../render/overlays.js';
import { startEditing } from '../ui/text-editor.js';
import { handleAt } from './handles.js';
import { registerTool } from './index.js';

function attachToSelectedBoxes() {
    const boxes = allBoxes().filter(b => state.selectedIds.has(b.id));
    if (!boxes.length) return;
    const arrows = allArrows().filter(a => !state.selectedIds.has(a.id));
    attachLooseEnds(arrows, boxes);
    const touching = arrows.filter(a => state.selectedIds.has(a.startId) || state.selectedIds.has(a.endId));
    attachLooseEnds(touching, allBoxes());
}

function moveGesture(start) {
    const before = snapshot();
    let last = start;
    let started = false;

    const selBoxes = allBoxes().filter(b => state.selectedIds.has(b.id));
    const selBoxIds = new Set(selBoxes.map(b => b.id));

    return {
        onMove(p) {
            const dx = p.x - last.x, dy = p.y - last.y;
            if (!dx && !dy) return;
            if (!started) {
                started = true;
                attachToSelectedBoxes();
            }

            state.shapes.forEach(s => {
                if (state.selectedIds.has(s.id)) moveShape(s, dx, dy);
            });

            // For arrows not explicitly in selection, if only one end is attached to a moving box,
            // translate the free end so the arrow moves synchronously with the box
            for (const a of allArrows()) {
                if (state.selectedIds.has(a.id)) continue;
                const startMoving = a.startId && selBoxIds.has(a.startId);
                const endMoving = a.endId && selBoxIds.has(a.endId);
                if (startMoving && !a.endId) {
                    a.x2 += dx;
                    a.y2 += dy;
                } else if (endMoving && !a.startId) {
                    a.x1 += dx;
                    a.y1 += dy;
                }
            }

            last = p;
            refresh();
        },
        onUp() {
            if (selBoxes.length) {
                attachLooseEnds(allArrows(), selBoxes);
            }
            for (const a of allArrows()) {
                if (selBoxIds.has(a.startId) || selBoxIds.has(a.endId) || state.selectedIds.has(a.id)) {
                    syncArrowCoords(a);
                }
            }
            finish(before);
        }
    };
}

function resizeGesture(h) {
    const s = getShape(h.id);
    const before = snapshot();
    const keepAspect = getDef(s).keepAspect;
    let started = false;
    return {
        cursor: h.cursor,
        onMove(p) {
            if (!started) { started = true; attachToSelectedBoxes(); }
            const w = Math.max(10, Math.abs(p.x - h.ax));
            const ht = keepAspect ? w / h.ratio : Math.max(10, Math.abs(p.y - h.ay));
            s.x = p.x < h.ax ? h.ax - w : h.ax;
            s.y = p.y < h.ay ? h.ay - ht : h.ay;
            s.w = w;
            s.h = ht;
            refresh();
        },
        onUp() {
            for (const a of allArrows()) {
                if (a.startId === s.id || a.endId === s.id) {
                    syncArrowCoords(a);
                }
            }
            finish(before);
        }
    };
}

function arrowEndGesture(h) {
    const a = getShape(h.id);
    const before = snapshot();
    delete a.anchor;
    delete a.route;
    delete a.startPort;
    delete a.endPort;
    a.straight = true;
    return {
        cursor: 'move',
        onMove(p) {
            if (h.which === 'start') {
                a.x1 = p.x; a.y1 = p.y;
                a.startId = magnetTarget(p, a.startId, a.endId);
            } else {
                a.x2 = p.x; a.y2 = p.y;
                a.endId = magnetTarget(p, a.endId, a.startId);
            }
            refresh();
        },
        onUp() {
            syncArrowCoords(a);
            finish(before);
        },
        drawOverlay: (c, z) => highlightBindings(c, z, a)
    };
}

function marqueeGesture(start) {
    const base = new Set(state.selectedIds);
    let rect = normRect(start.x, start.y, start.x, start.y);
    return {
        onMove(p) {
            rect = normRect(start.x, start.y, p.x, p.y);
            const sel = new Set(base);
            state.shapes.forEach(s => { if (rectsIntersect(bounds(s), rect)) sel.add(s.id); });
            state.selectedIds = sel;
            refresh();
        },
        onUp: () => refresh(),
        drawOverlay: (c) => drawMarquee(c, rect)
    };
}

registerTool({
    name: 'select',
    cursor: 'default',
    onHover(p) {
        const h = handleAt(p);
        if (h) return h.cursor;
        return hitTest(p) ? 'move' : 'default';
    },
    onDown(p, e) {
        const h = handleAt(p);
        if (h) return h.kind === 'resize' ? resizeGesture(h) : arrowEndGesture(h);
        const hit = hitTest(p);
        if (hit) {
            if (e.shiftKey) {
                if (state.selectedIds.has(hit.id)) state.selectedIds.delete(hit.id);
                else state.selectedIds.add(hit.id);
            } else if (!state.selectedIds.has(hit.id)) {
                state.selectedIds = new Set([hit.id]);
            }
            refresh();
            return moveGesture(p);
        }
        if (!e.shiftKey) state.selectedIds = new Set();
        refresh();
        return marqueeGesture(p);
    },
    onDoubleClick(p) {
        const hit = hitTest(p);
        if (isEditable(hit)) {
            state.selectedIds = new Set([hit.id]);
            startEditing(hit);
        } else if (!hit) {
            const before = snapshot();
            startEditing(addShape(makeText(p)), before);
        }
    }
});
