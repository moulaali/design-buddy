import { state, refresh } from '../state.js';
import { registerTool } from './index.js';

export function panGesture(e) {
    const sx = e.clientX, sy = e.clientY;
    const cam = { ...state.camera };
    return {
        isPan: true,
        cursor: 'grabbing',
        onMove(p, ev) {
            state.camera.x = cam.x - (ev.clientX - sx) / state.camera.zoom;
            state.camera.y = cam.y - (ev.clientY - sy) / state.camera.zoom;
            refresh();
        }
    };
}

registerTool({
    name: 'hand',
    cursor: 'grab',
    onDown: (p, e) => panGesture(e)
});
