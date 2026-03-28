import { formatPrice, escapeHtml, SpaceISError } from "@spaceis/react";
import DOMPurify from "isomorphic-dompurify";

/** Escape HTML to prevent XSS */
export function esc(str: unknown): string {
  return escapeHtml(str == null ? "" : String(str));
}

/** Format price from cents to "12,99 zl" */
export function fp(cents: number): string {
  return formatPrice(cents);
}

/** Extract user-friendly error message from SDK error */
export function getErrorMessage(err: unknown): string {
  if (!err) return "An error occurred";
  if (err instanceof SpaceISError) {
    if (err.isValidation) {
      const all = err.allFieldErrors ? err.allFieldErrors() : [];
      if (all.length > 0) return all[0];
    }
    return err.message || "An error occurred";
  }
  if (err instanceof Error) return err.message || "An error occurred";
  return "An error occurred";
}

/** Sanitize HTML from API to prevent XSS */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

/** Placeholder SVG for images */
export const PlaceholderSVG = ({
  size = 32,
}: {
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);
