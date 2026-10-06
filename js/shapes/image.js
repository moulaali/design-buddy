import { registerShape } from './registry.js';
import { refresh } from '../state.js';

const cache = new Map();

export function cacheImage(src, img) {
    cache.set(src, img);
}

function getImage(src) {
    let img = cache.get(src);
    if (!img) {
        img = new Image();
        img.onload = () => refresh();
        img.src = src;
        cache.set(src, img);
    }
    return img;
}

registerShape({
    type: 'image',
    traits: { box: true, resizable: true },
    keepAspect: true,
    draw(c, s) {
        const img = getImage(s.src);
        if (img.complete && img.naturalWidth) {
            c.drawImage(img, s.x, s.y, s.w, s.h);
        } else {
            c.strokeStyle = '#d1d5db';
            c.strokeRect(s.x, s.y, s.w, s.h);
        }
    }
});
