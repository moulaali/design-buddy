export const uid = () => Math.random().toString(36).slice(2, 10);
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

export function median(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function center(s) {
    return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

export function contains(s, p, tol = 0) {
    return p.x >= s.x - tol && p.x <= s.x + s.w + tol && p.y >= s.y - tol && p.y <= s.y + s.h + tol;
}

export function distToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = clamp(len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0, 0, 1);
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function rectsIntersect(a, b) {
    return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

export function normRect(x1, y1, x2, y2) {
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

export function rectDistance(r, p) {
    const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
    const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
    return Math.hypot(dx, dy);
}

export function rayHitDistance(o, d, r) {
    let tmin = 0, tmax = Infinity;
    for (const [oc, dc, lo, hi] of [[o.x, d.x, r.x, r.x + r.w], [o.y, d.y, r.y, r.y + r.h]]) {
        if (Math.abs(dc) < 1e-9) {
            if (oc < lo || oc > hi) return Infinity;
            continue;
        }
        let t1 = (lo - oc) / dc, t2 = (hi - oc) / dc;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return Infinity;
    }
    return tmin;
}

export function rectEdgePoint(s, toward, gap = 6) {
    const c = center(s);
    const dx = toward.x - c.x, dy = toward.y - c.y;
    if (dx === 0 && dy === 0) return c;
    const hw = s.w / 2 + gap, hh = s.h / 2 + gap;
    const t = Math.min(
        dx !== 0 ? hw / Math.abs(dx) : Infinity,
        dy !== 0 ? hh / Math.abs(dy) : Infinity
    );
    return { x: c.x + dx * t, y: c.y + dy * t };
}
