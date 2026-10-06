import { refresh } from '../state.js';
import { snapshot, finish } from '../history.js';
import { hitTest, removeShapes } from '../scene.js';
import { ERASER_CURSOR } from '../config.js';
import { registerTool } from './index.js';

function eraseAt(p) {
    const hit = hitTest(p);
    if (!hit) return;
    removeShapes(new Set([hit.id]));
    refresh();
}

registerTool({
    name: 'eraser',
    cursor: ERASER_CURSOR,
    onDown(p) {
        const before = snapshot();
        eraseAt(p);
        return {
            onMove: eraseAt,
            onUp: () => finish(before)
        };
    }
});
