import { state, getShape, refresh, subscribe } from '../state.js';
import { snapshot, finish } from '../history.js';
import { removeShapes } from '../scene.js';
import { layoutText } from '../shapes/text.js';
import { FONT_SIZE, LINE_HEIGHT, BOX_PADDING } from '../config.js';

const editor = document.getElementById('editor');
let editBefore = null;

export const isEditing = () => !!state.editingId;

export function startEditing(s, before = snapshot()) {
    state.editingId = s.id;
    editBefore = before;
    editor.value = s.text || '';
    editor.style.display = 'block';
    positionEditor();
    editor.focus();
    editor.select();
    refresh();
}

function positionEditor() {
    const s = getShape(state.editingId);
    if (!s) return;
    const { camera } = state;
    const z = camera.zoom;
    const left = (s.x - camera.x) * z;
    const top = (s.y - camera.y) * z;
    editor.style.fontSize = FONT_SIZE * z + 'px';
    editor.style.lineHeight = LINE_HEIGHT * z + 'px';
    if (s.type === 'text') {
        editor.style.textAlign = 'left';
        editor.style.whiteSpace = 'pre';
        editor.style.left = left + 'px';
        editor.style.top = top + 'px';
        editor.style.width = (s.w + FONT_SIZE) * z + 'px';
        editor.style.height = s.h * z + 'px';
    } else {
        const pad = BOX_PADDING * z;
        editor.style.textAlign = 'center';
        editor.style.whiteSpace = 'pre-wrap';
        editor.style.left = left + pad + 'px';
        editor.style.width = Math.max(10, s.w * z - 2 * pad) + 'px';
        editor.style.height = '0px';
        const contentH = Math.min(editor.scrollHeight, Math.max(LINE_HEIGHT * z, s.h * z - 2 * pad));
        editor.style.height = contentH + 'px';
        editor.style.top = top + (s.h * z - contentH) / 2 + 'px';
    }
}

export function commitEditing() {
    if (!state.editingId) return;
    const id = state.editingId;
    const s = getShape(id);
    state.editingId = null;
    editor.style.display = 'none';
    if (s) {
        s.text = editor.value;
        if (s.type === 'text') {
            if (s.text.trim()) layoutText(s);
            else removeShapes(new Set([id]));
        }
    }
    finish(editBefore);
}

editor.addEventListener('input', () => {
    const s = getShape(state.editingId);
    if (!s) return;
    s.text = editor.value;
    if (s.type === 'text') layoutText(s);
    refresh();
});

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        editor.blur();
    }
});

editor.addEventListener('blur', commitEditing);

subscribe(() => {
    if (state.editingId) positionEditor();
});
