import { registerShape } from './registry.js';
import { distToSegment } from '../geometry.js';

registerShape({
    type: 'pen',
    traits: {},
    draw(c, s) {
        const pts = s.points;
        if (!pts.length) return;
        c.beginPath();
        c.moveTo(pts[0].x, pts[0].y);
        if (pts.length < 3) {
            pts.forEach(p => c.lineTo(p.x, p.y));
        } else {
            for (let i = 1; i < pts.length - 1; i++) {
                const mx = (pts[i].x + pts[i + 1].x) / 2;
                const my = (pts[i].y + pts[i + 1].y) / 2;
                c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
            }
            const last = pts[pts.length - 1];
            c.lineTo(last.x, last.y);
        }
        c.stroke();
    },
    bounds(s) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of s.points) {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    },
    move(s, dx, dy) {
        s.points.forEach(p => { p.x += dx; p.y += dy; });
    },
    hitTest(s, p, tol) {
        const pts = s.points;
        if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y) <= tol;
        for (let j = 1; j < pts.length; j++) {
            if (distToSegment(p, pts[j - 1], pts[j]) <= tol) return true;
        }
        return false;
    }
});
