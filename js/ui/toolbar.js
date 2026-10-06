import { state, subscribe } from '../state.js';
import { canUndo, canRedo } from '../history.js';
import { setTool } from '../tools/index.js';
import * as actions from '../actions.js';

const dock = document.getElementById('dock');
const toolbar = document.getElementById('toolbar');
const moreMenu = document.getElementById('moreMenu');
const collapseBtn = document.getElementById('collapseBtn');

const ACTIONS = {
    undo: actions.undo,
    redo: actions.redo,
    delete: actions.deleteSelected,
    duplicate: actions.duplicateSelected,
    beautify: actions.beautify,
    export: actions.exportBoard,
    'reset-zoom': actions.resetZoom,
    clear: actions.clearCanvas
};

const actionBtn = (name) => dock.querySelector(`[data-action="${name}"]`);

function update() {
    toolbar.querySelectorAll('[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === state.tool);
    });
    const hasSelection = state.selectedIds.size > 0;
    actionBtn('undo').disabled = !canUndo();
    actionBtn('redo').disabled = !canRedo();
    actionBtn('delete').disabled = !hasSelection;
    actionBtn('duplicate').disabled = !hasSelection;
}

export function mountToolbar() {
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tool]');
        if (btn) setTool(btn.dataset.tool);
    });

    collapseBtn.addEventListener('click', () => {
        dock.classList.toggle('collapsed');
        moreMenu.hidden = true;
    });

    dock.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        const action = btn.dataset.action;
        if (action === 'more') {
            moreMenu.hidden = !moreMenu.hidden;
            return;
        }
        moreMenu.hidden = true;
        ACTIONS[action]?.();
    });

    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.menu-wrap')) moreMenu.hidden = true;
    });

    subscribe(update);
    update();
}
