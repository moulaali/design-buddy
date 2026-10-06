import { bounds, drawShape } from '../shapes/registry.js';

export function exportPNG(shapes, filename = 'design-buddy.png') {
    if (!shapes.length) return;
    const bs = shapes.map(bounds);
    const pad = 40, scale = 2;
    const minX = Math.min(...bs.map(b => b.x)) - pad;
    const minY = Math.min(...bs.map(b => b.y)) - pad;
    const maxX = Math.max(...bs.map(b => b.x + b.w)) + pad;
    const maxY = Math.max(...bs.map(b => b.y + b.h)) + pad;
    const out = document.createElement('canvas');
    out.width = (maxX - minX) * scale;
    out.height = (maxY - minY) * scale;
    const c = out.getContext('2d');
    c.fillStyle = '#fff';
    c.fillRect(0, 0, out.width, out.height);
    c.setTransform(scale, 0, 0, scale, -minX * scale, -minY * scale);
    shapes.forEach(s => drawShape(c, s));
    const link = document.createElement('a');
    link.download = filename;
    link.href = out.toDataURL('image/png');
    link.click();
}
