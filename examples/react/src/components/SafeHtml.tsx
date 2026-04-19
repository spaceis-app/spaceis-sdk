import DOMPurify from "isomorphic-dompurify";

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
}

/**
 * Render backend-supplied HTML (product description, CMS pages, statute)
 * through DOMPurify. Works in both Server Components and Client Components —
 * `isomorphic-dompurify` picks the right implementation automatically.
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = DOMPurify.sanitize(html ?? "");
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
