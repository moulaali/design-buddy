export const FONT_FAMILY = '"Shantell Sans", "Comic Sans MS", cursive';
export const FONT_SIZE = 18;
export const LINE_HEIGHT = Math.round(FONT_SIZE * 1.35);
export const BOX_PADDING = 12;
export const STROKE = '#1e1e1e';
export const STROKE_WIDTH = 2.5;
export const SELECT_COLOR = '#2f80ed';
export const STICKY_COLOR = '#fef08a';
export const RECT_RADIUS = 14;
export const STORAGE_KEY = 'design-buddy-board';
export const MAX_HISTORY = 100;
export const STRAIGHT_MIN_OVERLAP = 16;
export const SNAP_TAN = Math.tan(20 * Math.PI / 180);
export const LAYOUT_GAP = 24;
export const RANK_GAP = 96;
export const NODE_GAP = 56;
export const ATTACH_TOL = 40;
export const ATTACH_REACH = 160;
export const MAGNET_STRENGTH = 1;
export const MAGNET_RADIUS_PX = 40;
export const MAGNET_HOLD = 1.5;
export const ATTACH_FAR = 240;
export const ELBOW_RADIUS = 10;

export const FILL_COLORS = [
    { name: 'Green', color: '#c7f0d2' },
    { name: 'Red', color: '#ffd1d1' },
    { name: 'Orange', color: '#ffe0b8' },
    { name: 'Yellow', color: '#fff3b0' },
    { name: 'Blue', color: '#cfe3ff' },
    { name: 'Purple', color: '#e6d6ff' },
    { name: 'Pink', color: '#ffd6ec' },
    { name: 'Gray', color: '#e5e7eb' }
];

export const TOOL_SHORTCUTS = {
    v: 'select', h: 'hand', p: 'pen', e: 'eraser', a: 'arrow',
    t: 'text', n: 'sticky', i: 'image', r: 'rect', o: 'ellipse', d: 'cylinder'
};

const svgCursor = (svg, x, y) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, crosshair`;

export const ERASER_CURSOR = svgCursor(
    `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21z'/><path d='m5 11 9 9'/></svg>`,
    4, 18
);

export const PEN_CURSOR = svgCursor(
    `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='black' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/><path d='m15 5 4 4'/></svg>`,
    2, 22
);
