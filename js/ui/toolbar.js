import { state, subscribe } from '../state.js';
import { canUndo, canRedo, snapshot, finish } from '../history.js';
import { setTool } from '../tools/index.js';
import { PEN_COLORS } from '../config.js';
import * as actions from '../actions.js';

const dock = document.getElementById('dock');
const toolbar = document.getElementById('toolbar');
const moreMenu = document.getElementById('moreMenu');
const collapseBtn = document.getElementById('collapseBtn');
const penBtn = document.getElementById('penBtn');
const penDot = document.getElementById('penDot');
const penCaretBtn = document.getElementById('penCaretBtn');
const penPopover = document.getElementById('penPopover');
const penSwatches = document.getElementById('penSwatches');
const penSizes = document.getElementById('penSizes');

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

export function setPenColor(color) {
    state.penColor = color;
    localStorage.setItem('design-buddy-pen-color', color);
    if (penDot) penDot.style.background = color;

    penSwatches.querySelectorAll('.pen-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color.toLowerCase() === color.toLowerCase());
    });

    const selectedPens = state.shapes.filter(s => state.selectedIds.has(s.id) && s.type === 'pen');
    if (selectedPens.length) {
        const before = snapshot();
        selectedPens.forEach(s => { s.color = color; });
        finish(before);
    }
}

export function setPenSize(size) {
    const num = Number(size);
    state.penWidth = num;
    localStorage.setItem('design-buddy-pen-width', num);

    penSizes.querySelectorAll('.pen-size-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.size) === num);
    });

    const selectedPens = state.shapes.filter(s => state.selectedIds.has(s.id) && s.type === 'pen');
    if (selectedPens.length) {
        const before = snapshot();
        selectedPens.forEach(s => { s.strokeWidth = num; });
        finish(before);
    }
}

function update() {
    toolbar.querySelectorAll('[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === state.tool);
    });

    if (penDot) {
        penDot.style.background = state.penColor || '#ef4444';
    }
    if (penCaretBtn) {
        penCaretBtn.classList.toggle('active', state.tool === 'pen');
    }
    if (state.tool !== 'pen' && penPopover) {
        penPopover.hidden = true;
    }

    const hasSelection = state.selectedIds.size > 0;
    actionBtn('undo').disabled = !canUndo();
    actionBtn('redo').disabled = !canRedo();
    actionBtn('delete').disabled = !hasSelection;
    actionBtn('duplicate').disabled = !hasSelection;
}

export function mountToolbar() {
    PEN_COLORS.forEach(({ name, color }) => {
        const btn = document.createElement('button');
        btn.className = 'pen-swatch';
        btn.dataset.color = color;
        btn.title = name;
        btn.style.background = color;
        if (color.toLowerCase() === (state.penColor || '#ef4444').toLowerCase()) {
            btn.classList.add('active');
        }
        penSwatches.appendChild(btn);
    });

    penSwatches.addEventListener('click', (e) => {
        const swatch = e.target.closest('[data-color]');
        if (!swatch) return;
        setPenColor(swatch.dataset.color);
    });

    penSizes.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-size]');
        if (!btn) return;
        setPenSize(btn.dataset.size);
    });

    penSizes.querySelectorAll('.pen-size-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.size) === (state.penWidth || 3.5));
    });

    penCaretBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTool('pen');
        penPopover.hidden = !penPopover.hidden;
    });

    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tool]');
        if (!btn) return;

        if (btn.dataset.tool === 'pen') {
            if (state.tool === 'pen') {
                penPopover.hidden = !penPopover.hidden;
            } else {
                setTool('pen');
                penPopover.hidden = false;
            }
            return;
        }

        setTool(btn.dataset.tool);
    });

    collapseBtn.addEventListener('click', () => {
        dock.classList.toggle('collapsed');
        moreMenu.hidden = true;
        penPopover.hidden = true;
    });

    dock.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        const action = btn.dataset.action;
        if (action === 'more') {
            moreMenu.hidden = !moreMenu.hidden;
            penPopover.hidden = true;
            return;
        }
        moreMenu.hidden = true;
        ACTIONS[action]?.();
    });

    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.menu-wrap')) moreMenu.hidden = true;
        if (!e.target.closest('#penBtn') && !e.target.closest('#penCaretBtn') && !e.target.closest('#penPopover')) {
            penPopover.hidden = true;
        }
    });

    subscribe(update);
    update();
}
