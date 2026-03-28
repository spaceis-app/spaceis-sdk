import type { PaginationMeta } from "@spaceis/react";

interface PaginationProps {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={meta.current_page <= 1}
        onClick={() => {
          onPageChange(meta.current_page - 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        &larr; Previous
      </button>
      <span className="page-info">
        {meta.current_page} / {meta.last_page}
      </span>
      <button
        className="page-btn"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => {
          onPageChange(meta.current_page + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Next &rarr;
      </button>
    </div>
  );
}
