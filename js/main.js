import './shapes/index.js';
import './tools/select.js';
import './tools/hand.js';
import './tools/pen.js';
import './tools/eraser.js';
import './tools/arrow.js';
import './tools/place.js';
import './tools/image.js';
import './tools/shape.js';

import { state, subscribe, refresh } from './state.js';
import { load, save } from './storage.js';
import { resizeCanvas, requestDraw } from './render/renderer.js';
import { layoutText } from './shapes/text.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountContextMenu } from './ui/context-menu.js';
import { mountInput } from './ui/input.js';

state.shapes = load() || [];

subscribe((docChanged) => {
    if (docChanged) save(state.shapes);
    requestDraw();
});

mountToolbar();
mountContextMenu();
mountInput();

window.addEventListener('resize', () => {
    resizeCanvas();
    refresh();
});
resizeCanvas();

document.fonts.ready.then(() => {
    state.shapes.forEach(s => { if (s.type === 'text') layoutText(s); });
    requestDraw();
});
