import { refresh } from '../state.js';
import { snapshot, finish } from '../history.js';
import { addShape, removeShapes } from '../scene.js';
import { arrowPoints } from '../shapes/arrow.js';
import { highlightBindings } from '../render/overlays.js';
import { uid } from '../geometry.js';
import { magnetTarget, syncArrowCoords } from '../bindings.js';
import { registerTool } from './index.js';

registerTool({
    name: 'arrow',
    cursor: 'crosshair',
    revertToSelect: true,
    onDown(p) {
        const before = snapshot();
        const a = addShape({
            id: uid(), type: 'arrow',
            x1: p.x, y1: p.y, x2: p.x, y2: p.y,
            startId: magnetTarget(p, null, null), endId: null, straight: true
        });
        return {
            onMove(q) {
                a.x2 = q.x;
                a.y2 = q.y;
                a.endId = magnetTarget(q, a.endId, a.startId);
                refresh();
            },
            onUp() {
                const { start, end } = arrowPoints(a);
                if (Math.hypot(end.x - start.x, end.y - start.y) < 10) {
                    removeShapes(new Set([a.id]));
                } else {
                    syncArrowCoords(a);
                }
                finish(before);
            },
            drawOverlay: (c, z) => highlightBindings(c, z, a)
        };
    }
});
