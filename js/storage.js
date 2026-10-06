import { STORAGE_KEY } from './config.js';

export function save(shapes) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));
    } catch (err) {
        console.warn('Could not save board to localStorage', err);
    }
}

export function load() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data : null;
    } catch (err) {
        console.warn('Could not load saved board', err);
        return null;
    }
}
