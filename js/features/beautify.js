import { getShape } from '../state.js';
import { requiredHeight } from '../shapes/registry.js';
import { avg, median, center } from '../geometry.js';
import { SNAP_TAN, LAYOUT_GAP, RANK_GAP } from '../config.js';
import { attachLooseEnds, resolveDangling, syncArrowCoords } from '../bindings.js';
import { layeredLayout } from './layout.js';

function clusterBy(items, key, tol) {
    const sorted = [...items].sort((a, b) => key(a) - key(b));
    const groups = [];
    let cur = null;
    for (const it of sorted) {
        const k = key(it);
        if (cur && Math.abs(k - cur.sum / cur.items.length) <= tol) {
            cur.items.push(it);
            cur.sum += k;
        } else {
            cur = { items: [it], sum: k };
            groups.push(cur);
        }
    }
    return groups.map(g => g.items);
}

function unifySizes(boxes) {
    const byType = new Map();
    for (const b of boxes) {
        if (!byType.has(b.type)) byType.set(b.type, []);
        byType.get(b.type).push(b);
    }
    for (const group of byType.values()) {
        if (group.length < 2) continue;
        const w = median(group.map(b => b.w));
        const h = Math.max(median(group.map(b => b.h)), ...group.map(b => requiredHeight(b, w)));
        for (const b of group) {
            const c = center(b);
            b.w = w;
            b.h = h;
            b.x = c.x - w / 2;
            b.y = c.y - h / 2;
        }
    }
}

function alignRows(boxes) {
    const rows = clusterBy(boxes, b => b.y + b.h / 2, avg(boxes.map(b => b.h)) * 0.5);
    for (const row of rows) {
        if (row.length < 2) continue;
        const bottom = avg(row.map(b => b.y + b.h));
        row.forEach(b => { b.y = bottom - b.h; });
    }
    return rows;
}

function alignColumns(boxes) {
    const maxGap = avg(boxes.map(b => b.h)) * 2;
    for (const col of clusterBy(boxes, b => b.x + b.w / 2, avg(boxes.map(b => b.w)) * 0.5)) {
        if (col.length < 2) continue;
        col.sort((a, b) => a.y - b.y);
        let run = [col[0]];
        const flush = () => {
            if (run.length < 2) return;
            const left = avg(run.map(b => b.x));
            run.forEach(b => { b.x = left; });
        };
        for (let i = 1; i < col.length; i++) {
            const prev = run[run.length - 1];
            if (col[i].y - (prev.y + prev.h) <= maxGap) {
                run.push(col[i]);
            } else {
                flush();
                run = [col[i]];
            }
        }
        flush();
    }
}

function resolveOverlaps(rows) {
    const placed = [];
    const ordered = [...rows].sort((a, b) => Math.min(...a.map(s => s.y)) - Math.min(...b.map(s => s.y)));
    for (const row of ordered) {
        let shift = 0;
        for (const b of row) {
            for (const p of placed) {
                if (b.x < p.x + p.w && b.x + b.w > p.x) {
                    shift = Math.max(shift, p.y + p.h + LAYOUT_GAP - b.y);
                }
            }
        }
        if (shift > 0) row.forEach(b => { b.y += shift; });
        placed.push(...row);
    }
}

function snapPoint(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    if (Math.abs(dy) <= Math.abs(dx) * SNAP_TAN) return { x: to.x, y: from.y };
    if (Math.abs(dx) <= Math.abs(dy) * SNAP_TAN) return { x: from.x, y: to.y };
    return to;
}

function straightenArrows(arrows) {
    for (const a of arrows) {
        const sb = a.startId ? getShape(a.startId) : null;
        const eb = a.endId ? getShape(a.endId) : null;
        if (sb || eb) a.straight = true;
        if (sb && eb) {
            delete a.anchor;
            continue;
        } else if (sb) {
            const p = snapPoint(center(sb), { x: a.x2, y: a.y2 });
            a.x2 = p.x; a.y2 = p.y;
        } else if (eb) {
            const p = snapPoint(center(eb), { x: a.x1, y: a.y1 });
            a.x1 = p.x; a.y1 = p.y;
        } else {
            const p = snapPoint({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 });
            const midX = (a.x1 + a.x2) / 2, midY = (a.y1 + a.y2) / 2;
            if (p.y === a.y1 && a.y1 !== a.y2) { a.y1 = midY; a.y2 = midY; }
            else if (p.x === a.x1 && a.x1 !== a.x2) { a.x1 = midX; a.x2 = midX; }
        }
    }
}

function tidyInPlace(boxes) {
    if (boxes.length < 2) return;
    unifySizes(boxes);
    const rows = alignRows(boxes);
    alignColumns(boxes);
    resolveOverlaps(rows);
}

function topLeft(boxes) {
    return { x: Math.min(...boxes.map(b => b.x)), y: Math.min(...boxes.map(b => b.y)) };
}

function placeIsolated(isolated, nodes) {
    if (!isolated.length) return;
    let x = Math.min(...nodes.map(n => n.x));
    const y = Math.max(...nodes.map(n => n.y + n.h)) + RANK_GAP;
    isolated.sort((a, b) => center(a).x - center(b).x);
    for (const b of isolated) {
        b.x = x;
        b.y = y;
        x += b.w + LAYOUT_GAP * 2;
    }
}

function graphEdges(boxes, arrows) {
    const inScope = new Set(boxes);
    const edges = [];
    for (const a of arrows) {
        const from = a.startId && getShape(a.startId);
        const to = a.endId && getShape(a.endId);
        if (from && to && from !== to && inScope.has(from) && inScope.has(to)) edges.push({ from, to, arrow: a });
    }
    return edges;
}

function relayout(boxes, edges) {
    const origin = topLeft(boxes);
    unifySizes(boxes);
    const connected = new Set(edges.flatMap(e => [e.from, e.to]));
    const nodes = boxes.filter(b => connected.has(b));
    layeredLayout(nodes, edges);
    placeIsolated(boxes.filter(b => !connected.has(b)), nodes);
    const now = topLeft(boxes);
    boxes.forEach(b => { b.x += origin.x - now.x; b.y += origin.y - now.y; });
    for (const { arrow } of edges) {
        arrow.straight = true;
        delete arrow.anchor;
        delete arrow.startPort;
        delete arrow.endPort;
        arrow.route = 'elbow';
    }
}

function carryFreeEnds(arrows, oldCenters) {
    for (const a of arrows) {
        const sb = a.startId && getShape(a.startId);
        const eb = a.endId && getShape(a.endId);
        const box = sb && !eb ? sb : eb && !sb ? eb : null;
        const old = box && oldCenters.get(box);
        if (!old) continue;
        const c = center(box), dx = c.x - old.x, dy = c.y - old.y;
        if (sb) { a.x2 += dx; a.y2 += dy; } else { a.x1 += dx; a.y1 += dy; }
    }
}

export function beautifyLayout(boxes, arrows) {
    attachLooseEnds(arrows, boxes);
    resolveDangling(arrows, boxes);
    const oldCenters = new Map(boxes.map(b => [b, center(b)]));
    const edges = graphEdges(boxes, arrows);
    if (edges.length) relayout(boxes, edges);
    else tidyInPlace(boxes);
    const edgeArrows = new Set(edges.map(e => e.arrow));
    const others = arrows.filter(a => !edgeArrows.has(a));
    carryFreeEnds(others, oldCenters);
    straightenArrows(others);
    arrows.forEach(syncArrowCoords);
}
