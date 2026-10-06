import { avg, center } from '../geometry.js';
import { RANK_GAP, NODE_GAP } from '../config.js';

function flowDirection(edges) {
    let sx = 0, sy = 0;
    for (const { from, to } of edges) {
        const a = center(from), b = center(to);
        sx += Math.abs(b.x - a.x);
        sy += Math.abs(b.y - a.y);
    }
    return sx >= sy ? 'LR' : 'TB';
}

function adjacency(nodes, edges) {
    const out = new Map(nodes.map(n => [n, []]));
    const inc = new Map(nodes.map(n => [n, []]));
    for (const e of edges) {
        out.get(e.from).push(e.to);
        inc.get(e.to).push(e.from);
    }
    return { out, inc };
}

function acyclicEdges(nodes, edges, primary) {
    const outEdges = new Map(nodes.map(n => [n, []]));
    edges.forEach(e => outEdges.get(e.from).push(e));
    const visit = new Map();
    const keep = [];
    const dfs = (n) => {
        visit.set(n, 1);
        for (const e of outEdges.get(n)) {
            const s = visit.get(e.to);
            if (s === 1) continue;
            keep.push(e);
            if (!s) dfs(e.to);
        }
        visit.set(n, 2);
    };
    [...nodes].sort((a, b) => primary(a) - primary(b)).forEach(n => { if (!visit.get(n)) dfs(n); });
    return keep;
}

function assignRanks(nodes, dag) {
    const { out, inc } = adjacency(nodes, dag);
    const indeg = new Map(nodes.map(n => [n, inc.get(n).length]));
    const rank = new Map(nodes.map(n => [n, 0]));
    const queue = nodes.filter(n => !indeg.get(n));
    for (let i = 0; i < queue.length; i++) {
        const n = queue[i];
        for (const m of out.get(n)) {
            rank.set(m, Math.max(rank.get(m), rank.get(n) + 1));
            indeg.set(m, indeg.get(m) - 1);
            if (!indeg.get(m)) queue.push(m);
        }
    }
    for (const n of nodes) {
        if (!inc.get(n).length && out.get(n).length) {
            rank.set(n, Math.min(...out.get(n).map(m => rank.get(m))) - 1);
        }
    }
    return rank;
}

function orderLayers(layers, dag, cross) {
    const { out, inc } = adjacency(layers.flat(), dag);
    const pos = new Map();
    layers.forEach(layer => {
        layer.sort((a, b) => cross(a) - cross(b));
        layer.forEach((n, i) => pos.set(n, i));
    });
    const sweep = (layer, nbrs) => {
        const key = new Map(layer.map(n => {
            const ns = nbrs.get(n);
            return [n, ns.length ? avg(ns.map(m => pos.get(m))) : pos.get(n)];
        }));
        layer.sort((a, b) => key.get(a) - key.get(b));
        layer.forEach((n, i) => pos.set(n, i));
    };
    for (let iter = 0; iter < 4; iter++) {
        for (let i = 1; i < layers.length; i++) sweep(layers[i], inc);
        for (let i = layers.length - 2; i >= 0; i--) sweep(layers[i], out);
    }
}

function place(layers, horizontal) {
    const thickness = (n) => (horizontal ? n.w : n.h);
    const breadth = (n) => (horizontal ? n.h : n.w);
    const spans = layers.map(l => l.reduce((s, n) => s + breadth(n), 0) + NODE_GAP * (l.length - 1));
    const maxSpan = Math.max(...spans);
    let offset = 0;
    layers.forEach((layer, i) => {
        const thick = Math.max(...layer.map(thickness));
        let c = (maxSpan - spans[i]) / 2;
        for (const n of layer) {
            const m = offset + (thick - thickness(n)) / 2;
            if (horizontal) { n.x = m; n.y = c; } else { n.x = c; n.y = m; }
            c += breadth(n) + NODE_GAP;
        }
        offset += thick + RANK_GAP;
    });
}

export function layeredLayout(nodes, edges) {
    const dir = flowDirection(edges);
    const horizontal = dir === 'LR';
    const primary = (n) => (horizontal ? center(n).x : center(n).y);
    const cross = (n) => (horizontal ? center(n).y : center(n).x);
    const dag = acyclicEdges(nodes, edges, primary);
    const rank = assignRanks(nodes, dag);
    const layers = [];
    nodes.forEach(n => (layers[rank.get(n)] ||= []).push(n));
    const compact = layers.filter(l => l && l.length);
    orderLayers(compact, dag, cross);
    place(compact, horizontal);
    return dir;
}
