import { registerShape } from './registry.js';
import { fillCard } from '../render/paint.js';
import { drawBoxText, measureLines } from '../render/text.js';
import { RECT_RADIUS, LINE_HEIGHT, BOX_PADDING } from '../config.js';
import { center } from '../geometry.js';

const traits = { box: true, resizable: true, editable: true, fillable: true, layout: true };

function textHeight(s, w, widthFactor = 1) {
    const lines = measureLines(s.text, w * widthFactor - 2 * BOX_PADDING).length;
    return lines * LINE_HEIGHT + 2 * BOX_PADDING;
}

const cylinderRy = (s) => Math.min(s.h / 4, Math.max(6, s.w * 0.12));

registerShape({
    type: 'rect',
    traits,
    defaultSize: [160, 80],
    draw(c, s) {
        c.beginPath();
        c.roundRect(s.x, s.y, s.w, s.h, Math.min(RECT_RADIUS, s.w / 2, s.h / 2));
        fillCard(c, s);
        drawBoxText(c, s);
    },
    selectionRadius: (b, pad) => RECT_RADIUS + pad,
    requiredHeight: (s, w) => (s.text ? textHeight(s, w) : 0)
});

registerShape({
    type: 'ellipse',
    traits,
    defaultSize: [120, 120],
    draw(c, s) {
        c.beginPath();
        c.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
        fillCard(c, s);
        drawBoxText(c, s, 0, Math.SQRT1_2);
    },
    edgePoint(s, toward, gap) {
        const c = center(s);
        const dx = toward.x - c.x, dy = toward.y - c.y;
        if (dx === 0 && dy === 0) return c;
        const k = 1 / Math.sqrt((dx / (s.w / 2 + gap)) ** 2 + (dy / (s.h / 2 + gap)) ** 2);
        return { x: c.x + dx * k, y: c.y + dy * k };
    },
    halfWidthAt(s, y) {
        const t = (y - (s.y + s.h / 2)) / (s.h / 2);
        return (s.w / 2) * Math.sqrt(Math.max(0, 1 - t * t));
    },
    halfHeightAt(s, x) {
        const t = (x - (s.x + s.w / 2)) / (s.w / 2);
        return (s.h / 2) * Math.sqrt(Math.max(0, 1 - t * t));
    },
    selectionRadius: (b, pad) => Math.min(b.w, b.h) / 2 + pad,
    requiredHeight: (s, w) => (s.text ? textHeight(s, w, Math.SQRT1_2) / Math.SQRT1_2 : 0)
});

registerShape({
    type: 'cylinder',
    traits,
    defaultSize: [120, 140],
    draw(c, s) {
        const rx = s.w / 2, ry = cylinderRy(s), cx = s.x + rx;
        c.beginPath();
        c.moveTo(s.x, s.y + ry);
        c.lineTo(s.x, s.y + s.h - ry);
        c.ellipse(cx, s.y + s.h - ry, rx, ry, 0, Math.PI, 0, true);
        c.lineTo(s.x + s.w, s.y + ry);
        c.ellipse(cx, s.y + ry, rx, ry, 0, 0, Math.PI, true);
        c.closePath();
        fillCard(c, s);
        c.beginPath();
        c.ellipse(cx, s.y + ry, rx, ry, 0, 0, Math.PI, false);
        c.strokeStyle = 'rgba(15, 23, 42, 0.18)';
        c.stroke();
        drawBoxText(c, s, ry / 2);
    },
    requiredHeight: (s, w) => (s.text ? textHeight(s, w) + Math.max(6, w * 0.12) * 2 : 0)
});
