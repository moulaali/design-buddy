import { snapshot } from '../history.js';
import { addShape } from '../scene.js';
import { makeText } from '../shapes/text.js';
import { makeSticky } from '../shapes/sticky.js';
import { startEditing } from '../ui/text-editor.js';
import { registerTool, setTool } from './index.js';

function createPlaceTool(name, cursor, make) {
    return {
        name,
        cursor,
        onDown: () => ({
            onUp(p) {
                const before = snapshot();
                const shape = addShape(make(p));
                setTool('select');
                startEditing(shape, before);
            }
        })
    };
}

registerTool(createPlaceTool('text', 'text', makeText));
registerTool(createPlaceTool('sticky', 'crosshair', makeSticky));
