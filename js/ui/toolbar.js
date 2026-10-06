import { state, subscribe } from '../state.js';
import { canUndo, canRedo, snapshot, finish } from '../history.js';
import { setTool } from '../tools/index.js';
import { MARKER_COLORS } from '../config.js';
import * as actions from '../actions.js';

const dock = document.getElementById('dock');
const toolbar = document.getElementById('toolbar');
const moreMenu = document.getElementById('moreMenu');
const collapseBtn = document.getElementById('collapseBtn');
const penBtn = document.getElementById('penBtn');
const markerPopover = document.getElementById('markerPopover');
const markerSwatches = document.getElementById('markerSwatches');
const markerCustomInput = document.getElementById('markerCustomInput');
const markerSizes = document.getElementById('markerSizes');

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

export function setMarkerColor(color) {
    state.penColor = color;
    localStorage.setItem('design-buddy-pen-color', color);
    if (penBtn) penBtn.style.setProperty('--marker-color', color);
    if (markerCustomInput) markerCustomInput.value = color;

    markerSwatches.querySelectorAll('.marker-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color.toLowerCase() === color.toLowerCase());
    });

    const selectedPens = state.shapes.filter(s => state.selectedIds.has(s.id) && s.type === 'pen');
    if (selectedPens.length) {
        const before = snapshot();
        selectedPens.forEach(s => { s.color = color; });
        finish(before);
    }
}

export function setMarkerSize(size) {
    const num = Number(size);
    state.penWidth = num;
    localStorage.setItem('design-buddy-pen-width', num);

    markerSizes.querySelectorAll('.marker-size-btn').forEach(b => {
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

    if (penBtn) {
        penBtn.style.setProperty('--marker-color', state.penColor || '#e02424');
    }

    if (state.tool !== 'pen' && markerPopover) {
        markerPopover.hidden = true;
    }

    const hasSelection = state.selectedIds.size > 0;
    actionBtn('undo').disabled = !canUndo();
    actionBtn('redo').disabled = !canRedo();
    actionBtn('delete').disabled = !hasSelection;
    actionBtn('duplicate').disabled = !hasSelection;
}

export function mountToolbar() {
    MARKER_COLORS.forEach(({ name, color }) => {
        const btn = document.createElement('button');
        btn.className = 'marker-swatch';
        btn.dataset.color = color;
        btn.title = name;
        btn.style.background = color;
        if (color.toLowerCase() === (state.penColor || '#e02424').toLowerCase()) {
            btn.classList.add('active');
        }
        markerSwatches.appendChild(btn);
    });

    if (markerCustomInput) {
        markerCustomInput.value = state.penColor || '#e02424';
        markerCustomInput.addEventListener('input', (e) => {
            setMarkerColor(e.target.value);
        });
    }

    markerSwatches.addEventListener('click', (e) => {
        const swatch = e.target.closest('[data-color]');
        if (!swatch) return;
        setMarkerColor(swatch.dataset.color);
    });

    markerSizes.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-size]');
        if (!btn) return;
        setMarkerSize(btn.dataset.size);
    });

    // Initialize active size button
    markerSizes.querySelectorAll('.marker-size-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.size) === (state.penWidth || 3.5));
    });

    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tool]');
        if (!btn) return;

        if (btn.dataset.tool === 'pen') {
            if (state.tool === 'pen') {
                markerPopover.hidden = !markerPopover.hidden;
            } else {
                setTool('pen');
            }
            return;
        }

        setTool(btn.dataset.tool);
    });

    penBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        setTool('pen');
        markerPopover.hidden = false;
    });

    collapseBtn.addEventListener('click', () => {
        dock.classList.toggle('collapsed');
        moreMenu.hidden = true;
        markerPopover.hidden = true;
    });

    dock.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        const action = btn.dataset.action;
        if (action === 'more') {
            moreMenu.hidden = !moreMenu.hidden;
            markerPopover.hidden = true;
            return;
        }
        moreMenu.hidden = true;
        ACTIONS[action]?.();
    });

    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.menu-wrap')) moreMenu.hidden = true;
        if (!e.target.closest('#markerToolWrap')) markerPopover.hidden = true;
    });

    subscribe(update);
    update();
}
