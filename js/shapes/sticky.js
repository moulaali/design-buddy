import { registerShape } from './registry.js';
import { softShadow } from '../render/paint.js';
import { drawBoxText } from '../render/text.js';
import { STICKY_COLOR } from '../config.js';
import { uid } from '../geometry.js';

export const makeSticky = (p) => ({
    id: uid(), type: 'sticky', x: p.x - 100, y: p.y - 100, w: 200, h: 200, text: ''
});

registerShape({
    type: 'sticky',
    traits: { box: true, resizable: true, editable: true, fillable: true, layout: true },
    draw(c, s) {
        c.fillStyle = s.fill || STICKY_COLOR;
        c.beginPath();
        c.roundRect(s.x, s.y, s.w, s.h, 6);
        softShadow(c, 20, 8, 0.10);
        c.fill();
        softShadow(c, 3, 1, 0.08);
        c.fill();
        c.shadowColor = 'transparent';
        drawBoxText(c, s);
    }
});
