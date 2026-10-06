import { state } from '../state.js';
import { drawShape } from '../shapes/registry.js';
import { drawOverlays } from './overlays.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let pending = false;

export function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = dpr * state.camera.zoom;
    ctx.setTransform(k, 0, 0, k, -state.camera.x * k, -state.camera.y * k);
    for (const s of state.shapes) drawShape(ctx, s);
    drawOverlays(ctx);
}

export function requestDraw() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
        pending = false;
        draw();
    });
}

export function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    draw();
}
