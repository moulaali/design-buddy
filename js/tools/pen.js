import { state, refresh } from '../state.js';
import { snapshot, finish } from '../history.js';
import { addShape } from '../scene.js';
import { uid } from '../geometry.js';
import { PEN_CURSOR } from '../config.js';
import { registerTool } from './index.js';

registerTool({
    name: 'pen',
    cursor: PEN_CURSOR,
    onDown(p) {
        const before = snapshot();
        const s = addShape({ id: uid(), type: 'pen', points: [p] });
        state.selectedIds = new Set();
        return {
            onMove(q) {
                s.points.push(q);
                refresh();
            },
            onUp: () => finish(before)
        };
    }
});
