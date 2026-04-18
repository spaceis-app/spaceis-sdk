// format.js — Price formatting, HTML escaping, placeholder SVG, error helpers.

export function fp(cents) {
    return window.SpaceIS.formatPrice(cents);
}

export function placeholderSvg(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
}

export function getErrorMessage(err) {
    if (!err) return 'An error occurred';
    if (err instanceof window.SpaceIS.SpaceISError) {
        if (err.isValidation) {
            const all = err.allFieldErrors?.() ?? [];
            if (all.length > 0) return all[0];
        }
        return err.message || 'An error occurred';
    }
    if (err instanceof Error) return err.message || 'An error occurred';
    return 'An error occurred';
}

export function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
