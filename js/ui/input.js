import { state, refresh, subscribe, getShape, screenToWorld } from '../state.js';
import { isEditable } from '../shapes/registry.js';
import { currentTool, setTool, cursorFor } from '../tools/index.js';
import { panGesture } from '../tools/hand.js';
import { commitEditing, startEditing, isEditing } from './text-editor.js';
import { closeContextMenu } from './context-menu.js';
import { addImageFile } from '../features/images.js';
import { clamp } from '../geometry.js';
import { TOOL_SHORTCUTS } from '../config.js';
import * as actions from '../actions.js';

const canvas = document.getElementById('canvas');

const setCursor = (c) => { canvas.style.cursor = c; };
const toWorld = (e) => screenToWorld(e.clientX, e.clientY);

function hoverCursor(p) {
    const tool = currentTool();
    if (state.spaceDown || !tool?.onHover) return cursorFor();
    return tool.onHover(p);
}

function onPointerDown(e) {
    if (e.button === 2) return;
    commitEditing();
    canvas.setPointerCapture(e.pointerId);
    const p = toWorld(e);
    const gesture = e.button === 1 || state.spaceDown ? panGesture(e) : currentTool()?.onDown?.(p, e);
    if (!gesture) return;
    state.gesture = gesture;
    if (gesture.cursor) setCursor(gesture.cursor);
    refresh();
}

function onPointerMove(e) {
    const p = toWorld(e);
    if (!state.gesture) {
        setCursor(hoverCursor(p));
        return;
    }
    state.gesture.onMove?.(p, e);
}

function onPointerUp(e) {
    const gesture = state.gesture;
    if (!gesture) return;
    state.gesture = null;
    const tool = currentTool();
    gesture.onUp?.(toWorld(e), e);
    setCursor(cursorFor());
    if (!gesture.isPan && tool?.revertToSelect && state.tool === tool.name) setTool('select');
    else refresh();
}

function onWheel(e) {
    e.preventDefault();
    const { camera } = state;
    if (e.ctrlKey || e.metaKey) {
        const before = toWorld(e);
        camera.zoom = clamp(camera.zoom * Math.exp(-e.deltaY * 0.01), 0.1, 5);
        camera.x = before.x - e.clientX / camera.zoom;
        camera.y = before.y - e.clientY / camera.zoom;
    } else {
        camera.x += e.deltaX / camera.zoom;
        camera.y += e.deltaY / camera.zoom;
    }
    closeContextMenu();
    refresh();
}

function onKeyDown(e) {
    if (isEditing() || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if (mod) {
        const shortcuts = {
            z: () => (e.shiftKey ? actions.redo() : actions.undo()),
            y: actions.redo,
            d: actions.duplicateSelected,
            a: actions.selectAll
        };
        if (shortcuts[key]) {
            e.preventDefault();
            shortcuts[key]();
        }
        return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        actions.deleteSelected();
    } else if (e.key === 'Escape') {
        closeContextMenu();
        state.selectedIds = new Set();
        setTool('select');
    } else if (e.key === 'Enter' && state.selectedIds.size === 1) {
        const s = getShape([...state.selectedIds][0]);
        if (isEditable(s)) {
            e.preventDefault();
            startEditing(s);
        }
    } else if (e.key === ' ') {
        e.preventDefault();
        if (!state.spaceDown && !state.gesture) {
            state.spaceDown = true;
            setCursor('grab');
        }
    } else if (key === 'b') {
        actions.beautify();
    } else if (TOOL_SHORTCUTS[key]) {
        setTool(TOOL_SHORTCUTS[key]);
    }
}

function onKeyUp(e) {
    if (e.key !== ' ') return;
    state.spaceDown = false;
    if (!state.gesture) setCursor(cursorFor());
}

export function mountInput() {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    canvas.addEventListener('dblclick', (e) => {
        if (state.tool === 'select') currentTool()?.onDoubleClick?.(toWorld(e));
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('paste', (e) => {
        if (isEditing()) return;
        const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
        if (item) {
            e.preventDefault();
            addImageFile(item.getAsFile());
        }
    });

    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith('image/'));
        if (file) addImageFile(file, toWorld(e));
    });

    let lastTool = null;
    subscribe(() => {
        if (state.tool !== lastTool && !state.gesture) {
            lastTool = state.tool;
            setCursor(cursorFor());
        }
    });
    setCursor(cursorFor());
}
