import { viewportCenter } from '../state.js';
import { snapshot, finish } from '../history.js';
import { addShape } from '../scene.js';
import { cacheImage } from '../shapes/image.js';
import { setTool } from '../tools/index.js';
import { uid } from '../geometry.js';

const input = document.getElementById('imageInput');

export function pickImage() {
    input.click();
}

export function addImageFile(file, at = viewportCenter()) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
        const src = reader.result;
        const img = new Image();
        img.onload = () => {
            cacheImage(src, img);
            const scale = Math.min(1, 400 / Math.max(img.width, img.height));
            const w = img.width * scale, h = img.height * scale;
            const before = snapshot();
            addShape({ id: uid(), type: 'image', x: at.x - w / 2, y: at.y - h / 2, w, h, src });
            setTool('select');
            finish(before);
        };
        img.src = src;
    };
    reader.readAsDataURL(file);
}

input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    addImageFile(file);
});
