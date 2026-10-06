import { FONT_FAMILY, FONT_SIZE, LINE_HEIGHT, BOX_PADDING, STROKE } from '../config.js';
import { state } from '../state.js';

const measureCtx = document.createElement('canvas').getContext('2d');

export const font = () => `${FONT_SIZE}px ${FONT_FAMILY}`;

export function wrapText(c, text, maxWidth) {
    const lines = [];
    for (const para of text.split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
            const test = line ? line + ' ' + word : word;
            if (line && c.measureText(test).width > maxWidth) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        lines.push(line);
    }
    return lines;
}

export function measureLines(text, maxWidth) {
    measureCtx.font = font();
    return wrapText(measureCtx, text, maxWidth);
}

export function measureWidth(line) {
    measureCtx.font = font();
    return measureCtx.measureText(line).width;
}

export function drawBoxText(c, s, dy = 0, widthFactor = 1) {
    if (!s.text || s.id === state.editingId) return;
    c.font = font();
    c.fillStyle = STROKE;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const lines = wrapText(c, s.text, s.w * widthFactor - 2 * BOX_PADDING);
    const cx = s.x + s.w / 2;
    const startY = s.y + dy + s.h / 2 - (lines.length * LINE_HEIGHT) / 2 + LINE_HEIGHT / 2;
    lines.forEach((line, i) => c.fillText(line, cx, startY + i * LINE_HEIGHT));
}
