import { state, getShape } from '../state.js';
import { SELECT_COLOR } from '../config.js';
import { bounds, getDef, isResizable, selectionRadius } from '../shapes/registry.js';
import { handleCorners } from '../tools/handles.js';
import { boxPorts, arrowPoints } from '../shapes/arrow.js';

function drawHandle(c, x, y, z, round = false) {
    const r = 4.5 / z;
    c.beginPath();
    if (round) c.arc(x, y, r, 0, Math.PI * 2);
    else c.rect(x - r, y - r, r * 2, r * 2);
    c.fill();
    c.stroke();
}

export function highlightBindings(c, z, arrow) {
    c.save();
    const pad = 4 / z;
    const portR = 3.5 / z;
    const activeR = 5.5 / z;
    const pts = arrowPoints(arrow);

    for (const [id, isStart] of [[arrow.startId, true], [arrow.endId, false]]) {
        const b = id && getShape(id);
        if (!b) continue;

        c.strokeStyle = SELECT_COLOR;
        c.lineWidth = 1.5 / z;
        c.beginPath();
        c.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 8 / z);
        c.stroke();

        const ports = boxPorts(b);
        const docked = isStart ? pts.start : pts.end;

        for (const pt of ports) {
            const isDocked = Math.hypot(pt.x - docked.x, pt.y - docked.y) < 3 / z;
            c.beginPath();
            if (isDocked) {
                c.arc(pt.x, pt.y, activeR, 0, Math.PI * 2);
                c.fillStyle = SELECT_COLOR;
                c.fill();
                c.strokeStyle = '#ffffff';
                c.lineWidth = 2 / z;
                c.stroke();
            } else {
                c.arc(pt.x, pt.y, portR, 0, Math.PI * 2);
                c.fillStyle = '#ffffff';
                c.fill();
                c.strokeStyle = SELECT_COLOR;
                c.lineWidth = 1.5 / z;
                c.stroke();
            }
        }
    }
    c.restore();
}

export function drawMarquee(c, r) {
    c.save();
    c.fillStyle = 'rgba(47, 128, 237, 0.08)';
    c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeRect(r.x, r.y, r.w, r.h);
    c.restore();
}

function drawSelection(c, z) {
    for (const id of state.selectedIds) {
        const s = getShape(id);
        if (!s) continue;
        const handles = getDef(s)?.selectionHandles?.(s);
        if (handles) {
            handles.forEach(pt => drawHandle(c, pt.x, pt.y, z, true));
            continue;
        }
        const b = bounds(s);
        const pad = 4 / z;
        c.beginPath();
        c.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, selectionRadius(s, b, pad, z));
        c.stroke();
        if (state.selectedIds.size === 1 && isResizable(s)) {
            handleCorners(s).forEach(h => drawHandle(c, h.x, h.y, z));
        }
    }
}

export function drawOverlays(c) {
    const z = state.camera.zoom;
    c.save();
    c.strokeStyle = SELECT_COLOR;
    c.fillStyle = '#fff';
    c.lineWidth = 1.5 / z;
    state.gesture?.drawOverlay?.(c, z);
    drawSelection(c, z);
    c.restore();
}
