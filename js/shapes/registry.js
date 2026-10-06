import { contains, rectEdgePoint } from '../geometry.js';
import { STROKE, STROKE_WIDTH } from '../config.js';

const defs = new Map();

export function registerShape(def) {
    defs.set(def.type, def);
}

export const getDef = (s) => defs.get(s?.type);

const trait = (name) => (s) => !!getDef(s)?.traits?.[name];
export const isBox = trait('box');
export const isResizable = trait('resizable');
export const isEditable = trait('editable');
export const isFillable = trait('fillable');
export const isLayoutBox = trait('layout');

export function bounds(s) {
    const d = getDef(s);
    return d?.bounds ? d.bounds(s) : { x: s.x, y: s.y, w: s.w, h: s.h };
}

export function moveShape(s, dx, dy) {
    const d = getDef(s);
    if (d?.move) {
        d.move(s, dx, dy);
    } else {
        s.x += dx;
        s.y += dy;
    }
}

export function hitShape(s, p, tol) {
    const d = getDef(s);
    return d?.hitTest ? d.hitTest(s, p, tol) : contains(s, p, tol);
}

export function edgePoint(s, toward, gap = 6) {
    const d = getDef(s);
    return d?.edgePoint ? d.edgePoint(s, toward, gap) : rectEdgePoint(s, toward, gap);
}

export const halfWidthAt = (s, y) => getDef(s)?.halfWidthAt?.(s, y) ?? s.w / 2;
export const halfHeightAt = (s, x) => getDef(s)?.halfHeightAt?.(s, x) ?? s.h / 2;
export const requiredHeight = (s, w) => getDef(s)?.requiredHeight?.(s, w) ?? 0;
export const selectionRadius = (s, b, pad, z) => getDef(s)?.selectionRadius?.(b, pad) ?? 4 / z;

export function drawShape(c, s) {
    const d = getDef(s);
    if (!d) return;
    c.save();
    c.strokeStyle = STROKE;
    c.fillStyle = STROKE;
    c.lineWidth = STROKE_WIDTH;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    d.draw(c, s);
    c.restore();
}
