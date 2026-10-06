import { registerShape } from './registry.js';
import { font, measureWidth } from '../render/text.js';
import { LINE_HEIGHT } from '../config.js';
import { state } from '../state.js';
import { uid } from '../geometry.js';

export function layoutText(s) {
    const lines = (s.text || '').split('\n');
    s.w = Math.max(20, ...lines.map(measureWidth));
    s.h = lines.length * LINE_HEIGHT;
}

export function makeText(p) {
    const s = { id: uid(), type: 'text', x: p.x, y: p.y - LINE_HEIGHT / 2, text: '' };
    layoutText(s);
    return s;
}

registerShape({
    type: 'text',
    traits: { box: true, editable: true },
    draw(c, s) {
        if (s.id === state.editingId) return;
        c.font = font();
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        (s.text || '').split('\n').forEach((line, i) => {
            c.fillText(line, s.x, s.y + i * LINE_HEIGHT + LINE_HEIGHT / 2);
        });
    }
});
