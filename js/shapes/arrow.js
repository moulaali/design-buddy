import { registerShape } from './registry.js';
import { getShape } from '../state.js';
import { center, normRect, distToSegment } from '../geometry.js';
import { ELBOW_RADIUS } from '../config.js';

export function boxPort(b, side) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    switch (side) {
        case 'top': return { x: cx, y: b.y, side };
        case 'bottom': return { x: cx, y: b.y + b.h, side };
        case 'left': return { x: b.x, y: cy, side };
        case 'right': return { x: b.x + b.w, y: cy, side };
        default: return { x: cx, y: cy, side: 'center' };
    }
}

export function boxPorts(b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    return [
        { side: 'top', x: cx, y: b.y },
        { side: 'right', x: b.x + b.w, y: cy },
        { side: 'bottom', x: cx, y: b.y + b.h },
        { side: 'left', x: b.x, y: cy }
    ];
}

export function bestFacingSides(a, b) {
    const ca = center(a), cb = center(b);
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    const spanX = (a.w + b.w) / 2 || 1;
    const spanY = (a.h + b.h) / 2 || 1;
    const nx = dx / spanX, ny = dy / spanY;
    if (Math.abs(nx) >= Math.abs(ny)) {
        return nx >= 0
            ? { from: 'right', to: 'left', axis: 'x' }
            : { from: 'left', to: 'right', axis: 'x' };
    }
    return ny >= 0
        ? { from: 'bottom', to: 'top', axis: 'y' }
        : { from: 'top', to: 'bottom', axis: 'y' };
}

export function bestFacingSideForPoint(b, p) {
    const c = center(b);
    const dx = p.x - c.x, dy = p.y - c.y;
    const nx = dx / (b.w / 2 || 1), ny = dy / (b.h / 2 || 1);
    if (Math.abs(nx) >= Math.abs(ny)) {
        return dx >= 0 ? 'right' : 'left';
    }
    return dy >= 0 ? 'bottom' : 'top';
}

export function arrowPoints(a) {
    const sb = a.startId ? getShape(a.startId) : null;
    const eb = a.endId ? getShape(a.endId) : null;
    if (sb && eb) {
        const { from, to } = bestFacingSides(sb, eb);
        const sideA = a.startPort || from;
        const sideB = a.endPort || to;
        return {
            start: boxPort(sb, sideA),
            end: boxPort(eb, sideB)
        };
    }
    if (sb) {
        const p = { x: a.x2, y: a.y2 };
        const side = a.startPort || bestFacingSideForPoint(sb, p);
        return {
            start: boxPort(sb, side),
            end: p
        };
    }
    if (eb) {
        const p = { x: a.x1, y: a.y1 };
        const side = a.endPort || bestFacingSideForPoint(eb, p);
        return {
            start: p,
            end: boxPort(eb, side)
        };
    }
    return {
        start: { x: a.x1, y: a.y1 },
        end: { x: a.x2, y: a.y2 }
    };
}

export function arrowPath(a) {
    const { start, end } = arrowPoints(a);
    const sb = a.startId ? getShape(a.startId) : null;
    const eb = a.endId ? getShape(a.endId) : null;
    if (a.route !== 'elbow' || !sb || !eb) return [start, end];

    const facing = bestFacingSides(sb, eb);
    const sideA = a.startPort || facing.from;
    const sideB = a.endPort || facing.to;

    if (sideA === 'right' && sideB === 'left') {
        if (Math.abs(start.y - end.y) < 2) return [start, end];
        if (start.x < end.x) {
            const mx = (start.x + end.x) / 2;
            return [start, { x: mx, y: start.y }, { x: mx, y: end.y }, end];
        }
        const my = (sb.y + sb.h <= eb.y || eb.y + eb.h <= sb.y) ? (start.y + end.y) / 2 : Math.min(sb.y, eb.y) - 24;
        return [start, { x: start.x + 20, y: start.y }, { x: start.x + 20, y: my }, { x: end.x - 20, y: my }, { x: end.x - 20, y: end.y }, end];
    }
    if (sideA === 'left' && sideB === 'right') {
        if (Math.abs(start.y - end.y) < 2) return [start, end];
        if (start.x > end.x) {
            const mx = (start.x + end.x) / 2;
            return [start, { x: mx, y: start.y }, { x: mx, y: end.y }, end];
        }
        const my = (sb.y + sb.h <= eb.y || eb.y + eb.h <= sb.y) ? (start.y + end.y) / 2 : Math.min(sb.y, eb.y) - 24;
        return [start, { x: start.x - 20, y: start.y }, { x: start.x - 20, y: my }, { x: end.x + 20, y: my }, { x: end.x + 20, y: end.y }, end];
    }
    if (sideA === 'bottom' && sideB === 'top') {
        if (Math.abs(start.x - end.x) < 2) return [start, end];
        if (start.y < end.y) {
            const my = (start.y + end.y) / 2;
            return [start, { x: start.x, y: my }, { x: end.x, y: my }, end];
        }
        const mx = (sb.x + sb.w <= eb.x || eb.x + eb.w <= sb.x) ? (start.x + end.x) / 2 : Math.max(sb.x + sb.w, eb.x + eb.w) + 24;
        return [start, { x: start.x, y: start.y + 20 }, { x: mx, y: start.y + 20 }, { x: mx, y: end.y - 20 }, { x: end.x, y: end.y - 20 }, end];
    }
    if (sideA === 'top' && sideB === 'bottom') {
        if (Math.abs(start.x - end.x) < 2) return [start, end];
        if (start.y > end.y) {
            const my = (start.y + end.y) / 2;
            return [start, { x: start.x, y: my }, { x: end.x, y: my }, end];
        }
        const mx = (sb.x + sb.w <= eb.x || eb.x + eb.w <= sb.x) ? (start.x + end.x) / 2 : Math.max(sb.x + sb.w, eb.x + eb.w) + 24;
        return [start, { x: start.x, y: start.y - 20 }, { x: mx, y: start.y - 20 }, { x: mx, y: end.y + 20 }, { x: end.x, y: end.y + 20 }, end];
    }

    if (sideA === 'right' || sideA === 'left') {
        return [start, { x: end.x, y: start.y }, end];
    }
    return [start, { x: start.x, y: end.y }, end];
}

function strokePath(c, pts) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1], cur = pts[i], next = pts[i + 1];
        const r = Math.min(
            ELBOW_RADIUS,
            Math.hypot(cur.x - prev.x, cur.y - prev.y) / 2,
            Math.hypot(next.x - cur.x, next.y - cur.y) / 2
        );
        c.arcTo(cur.x, cur.y, next.x, next.y, r);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last.x, last.y);
    c.stroke();
}

registerShape({
    type: 'arrow',
    traits: {},
    draw(c, s) {
        const pts = arrowPath(s);
        strokePath(c, pts);
        const start = pts[pts.length - 2], end = pts[pts.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const len = 14, spread = Math.PI / 7;
        c.beginPath();
        c.moveTo(end.x - len * Math.cos(angle - spread), end.y - len * Math.sin(angle - spread));
        c.lineTo(end.x, end.y);
        c.lineTo(end.x - len * Math.cos(angle + spread), end.y - len * Math.sin(angle + spread));
        c.stroke();
    },
    bounds(s) {
        const pts = arrowPath(s);
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        return normRect(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    },
    move(s, dx, dy) {
        s.x1 += dx; s.y1 += dy; s.x2 += dx; s.y2 += dy;
    },
    hitTest(s, p, tol) {
        const pts = arrowPath(s);
        for (let i = 1; i < pts.length; i++) {
            if (distToSegment(p, pts[i - 1], pts[i]) <= tol) return true;
        }
        return false;
    },
    selectionHandles(s) {
        const { start, end } = arrowPoints(s);
        return [start, end];
    }
});
