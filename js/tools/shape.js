import { refresh } from '../state.js';
import { snapshot, finish } from '../history.js';
import { addShape } from '../scene.js';
import { getDef } from '../shapes/registry.js';
import { normRect, uid } from '../geometry.js';
import { registerTool } from './index.js';

function createShapeTool(type) {
    return {
        name: type,
        cursor: 'crosshair',
        revertToSelect: true,
        onDown(start) {
            const before = snapshot();
            const s = addShape({ id: uid(), type, x: start.x, y: start.y, w: 0, h: 0, text: '' });
            return {
                onMove(p, e) {
                    let { x, y } = p;
                    if (e.shiftKey) {
                        const size = Math.max(Math.abs(x - start.x), Math.abs(y - start.y));
                        x = start.x + Math.sign(x - start.x || 1) * size;
                        y = start.y + Math.sign(y - start.y || 1) * size;
                    }
                    Object.assign(s, normRect(start.x, start.y, x, y));
                    refresh();
                },
                onUp(p) {
                    if (s.w < 5 || s.h < 5) {
                        const [w, h] = getDef(s).defaultSize;
                        Object.assign(s, { x: p.x - w / 2, y: p.y - h / 2, w, h });
                    }
                    finish(before);
                }
            };
        }
    };
}

['rect', 'ellipse', 'cylinder'].forEach(type => registerTool(createShapeTool(type)));
