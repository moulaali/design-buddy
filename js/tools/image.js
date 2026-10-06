import { pickImage } from '../features/images.js';
import { registerTool } from './index.js';

registerTool({
    name: 'image',
    activate() {
        pickImage();
        return false;
    }
});
