import { state, refresh, screenToWorld } from '../state.js';
import { hitTest } from '../scene.js';
import { setTool } from '../tools/index.js';
import { commitEditing } from './text-editor.js';
import { FILL_COLORS } from '../config.js';
import { applyFill, deleteSelected, duplicateSelected, selectedFillables } from '../actions.js';

const canvas = document.getElementById('canvas');
const menu = document.getElementById('contextMenu');
const fillItem = document.getElementById('fillItem');
const swatches = document.getElementById('swatches');

function open(x, y) {
    const targets = selectedFillables();
    fillItem.classList.toggle('disabled', !targets.length);
    const first = targets.length ? (targets[0].fill || '') : null;
    const current = targets.every(s => (s.fill || '') === first) ? first : null;
    menu.querySelectorAll('[data-fill]').forEach(b => {
        b.classList.toggle('active', b.dataset.fill === current);
    });
    menu.hidden = false;
    const r = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.classList.toggle('flip', left + r.width + 180 > window.innerWidth);
}

export function closeContextMenu() {
    menu.hidden = true;
    fillItem.classList.remove('open');
}

export function mountContextMenu() {
    FILL_COLORS.forEach(({ name, color }) => {
        const btn = document.createElement('button');
        btn.className = 'swatch';
        btn.dataset.fill = color;
        btn.title = name;
        btn.style.background = color;
        swatches.appendChild(btn);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        commitEditing();
        state.gesture = null;
        const hit = hitTest(screenToWorld(e.clientX, e.clientY));
        if (!hit) {
            closeContextMenu();
            return;
        }
        if (state.tool !== 'select') setTool('select');
        if (!state.selectedIds.has(hit.id)) state.selectedIds = new Set([hit.id]);
        refresh();
        open(e.clientX, e.clientY);
    });

    menu.addEventListener('contextmenu', (e) => e.preventDefault());

    menu.addEventListener('click', (e) => {
        const fillBtn = e.target.closest('[data-fill]');
        if (fillBtn) {
            applyFill(fillBtn.dataset.fill);
            closeContextMenu();
            return;
        }
        if (e.target.closest('#fillItem')) {
            if (!fillItem.classList.contains('disabled')) fillItem.classList.toggle('open');
            return;
        }
        const action = e.target.closest('[data-ctx]');
        if (!action) return;
        closeContextMenu();
        if (action.dataset.ctx === 'delete') deleteSelected();
        else if (action.dataset.ctx === 'duplicate') duplicateSelected();
    });

    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('#contextMenu')) closeContextMenu();
    });
}
