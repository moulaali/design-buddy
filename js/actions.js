import { state, refresh, selectedShapes } from './state.js';
import * as history from './history.js';
import { removeShapes } from './scene.js';
import { moveShape, isFillable, isLayoutBox } from './shapes/registry.js';
import { arrowPoints } from './shapes/arrow.js';
import { beautifyLayout } from './features/beautify.js';
import { exportPNG } from './features/export.js';
import { commitEditing } from './ui/text-editor.js';
import { uid } from './geometry.js';

export function undo() {
    commitEditing();
    history.undo();
}

export function redo() {
    commitEditing();
    history.redo();
}

export function deleteSelected() {
    if (!state.selectedIds.size) return;
    history.transaction(() => removeShapes(new Set(state.selectedIds)));
}

export function duplicateSelected() {
    if (!state.selectedIds.size) return;
    history.transaction(() => {
        const idMap = new Map();
        const pairs = selectedShapes().map(s => {
            const copy = JSON.parse(JSON.stringify(s));
            copy.id = uid();
            idMap.set(s.id, copy.id);
            return [s, copy];
        });
        for (const [orig, copy] of pairs) {
            if (copy.type === 'arrow') {
                const { start, end } = arrowPoints(orig);
                copy.x1 = start.x; copy.y1 = start.y; copy.x2 = end.x; copy.y2 = end.y;
                copy.startId = idMap.get(orig.startId) || null;
                copy.endId = idMap.get(orig.endId) || null;
            }
            moveShape(copy, 20, 20);
        }
        state.shapes.push(...pairs.map(([, c]) => c));
        state.selectedIds = new Set(pairs.map(([, c]) => c.id));
    });
}

export function selectAll() {
    state.selectedIds = new Set(state.shapes.map(s => s.id));
    refresh();
}

export function beautify() {
    commitEditing();
    const inScope = state.selectedIds.size ? (s) => state.selectedIds.has(s.id) : () => true;
    const boxes = state.shapes.filter(s => inScope(s) && isLayoutBox(s));
    const boxIds = new Set(boxes.map(b => b.id));
    const arrows = state.shapes.filter(s => s.type === 'arrow' &&
        (inScope(s) || boxIds.has(s.startId) || boxIds.has(s.endId)));
    if (!boxes.length && !arrows.length) return;
    history.transaction(() => beautifyLayout(boxes, arrows));
}

export const selectedFillables = () => selectedShapes().filter(isFillable);

export function applyFill(color) {
    const targets = selectedFillables();
    if (!targets.length) return;
    history.transaction(() => {
        targets.forEach(s => {
            if (color) s.fill = color;
            else delete s.fill;
        });
    });
}

export function clearCanvas() {
    if (!state.shapes.length || !confirm('Clear the whole canvas?')) return;
    history.transaction(() => {
        state.shapes = [];
        state.selectedIds = new Set();
    });
}

export function resetZoom() {
    state.camera = { x: 0, y: 0, zoom: 1 };
    refresh();
}

export const exportBoard = () => exportPNG(state.shapes);
