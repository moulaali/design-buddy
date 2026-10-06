export const state = {
    shapes: [],
    selectedIds: new Set(),
    tool: 'select',
    camera: { x: 0, y: 0, zoom: 1 },
    gesture: null,
    spaceDown: false,
    editingId: null,
    penColor: localStorage.getItem('design-buddy-pen-color') || '#e02424',
    penWidth: Number(localStorage.getItem('design-buddy-pen-width')) || 3.5
};

const listeners = new Set();

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function emit(docChanged) {
    for (const fn of listeners) fn(docChanged);
}

export const commit = () => emit(true);

export const refresh = () => emit(false);

export const getShape = (id) => state.shapes.find(s => s.id === id);

export const selectedShapes = () => state.shapes.filter(s => state.selectedIds.has(s.id));

export function screenToWorld(sx, sy) {
    const { camera } = state;
    return { x: sx / camera.zoom + camera.x, y: sy / camera.zoom + camera.y };
}

export const viewportCenter = () => screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
