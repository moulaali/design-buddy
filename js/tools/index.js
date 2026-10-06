import { state, refresh } from '../state.js';
import { commitEditing } from '../ui/text-editor.js';

const tools = new Map();

export function registerTool(tool) {
    tools.set(tool.name, tool);
}

export const currentTool = () => tools.get(state.tool);

export function setTool(name) {
    commitEditing();
    const tool = tools.get(name);
    if (!tool) return;
    if (tool.activate && tool.activate() === false) return;
    state.tool = name;
    if (name !== 'select') state.selectedIds = new Set();
    refresh();
}

export function cursorFor() {
    if (state.spaceDown) return 'grab';
    return currentTool()?.cursor || 'default';
}
