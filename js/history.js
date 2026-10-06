import { state, commit, refresh } from './state.js';
import { MAX_HISTORY } from './config.js';

let undoStack = [];
let redoStack = [];

export const snapshot = () => JSON.stringify(state.shapes);
export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

function record(before) {
    undoStack.push(before);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
}

export function finish(before) {
    if (snapshot() !== before) {
        record(before);
        commit();
    } else {
        refresh();
    }
}

export function transaction(fn) {
    const before = snapshot();
    fn();
    finish(before);
}

function restore(from, to) {
    if (!from.length) return;
    to.push(snapshot());
    state.shapes = JSON.parse(from.pop());
    state.selectedIds = new Set();
    commit();
}

export const undo = () => restore(undoStack, redoStack);
export const redo = () => restore(redoStack, undoStack);
