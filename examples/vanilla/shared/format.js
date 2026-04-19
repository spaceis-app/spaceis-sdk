// examples/vanilla/shared/format.js
// Short aliases for SDK utilities used throughout all pages.

/** Escape HTML to prevent XSS — wraps SpaceIS.escapeHtml */
export function esc(str) {
  return window.SpaceIS.escapeHtml(str == null ? "" : String(str));
}

/** Format price from cents → "12,99 zł" — wraps SpaceIS.formatPrice */
export function fp(cents) {
  return window.SpaceIS.formatPrice(cents);
}

/** Extract user-friendly error message from SDK error */
export function getErrorMessage(err) {
  if (!err) return "An error occurred";
  if (window.SpaceIS.SpaceISError && err instanceof window.SpaceIS.SpaceISError) {
    if (err.isValidation) {
      const all = err.allFieldErrors?.() ?? [];
      if (all.length > 0) return all[0];
    }
    return err.message || "An error occurred";
  }
  return err.message || "An error occurred";
}

// SVG placeholder images at three sizes — avoids repeating inline SVG
export const PLACEHOLDER_SVG_SM =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
export const PLACEHOLDER_SVG_MD =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
export const PLACEHOLDER_SVG_LG =
  '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
