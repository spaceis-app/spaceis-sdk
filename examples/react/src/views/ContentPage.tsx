"use client";

import Link from "next/link";
import { usePages, usePage } from "@spaceis/react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function PagesListPage() {
  const { data: pages, isLoading } = usePages();

  if (isLoading) {
    return (
      <div className="page-content">
        <h1 className="page-heading">Pages</h1>
        <div className="spinner" />
      </div>
    );
  }

  const pageList = pages ?? [];

  return (
    <div className="page-content">
      <h1 className="page-heading">Pages</h1>

      {pageList.length === 0 ? (
        <div className="empty-state">
          <p>No pages available.</p>
        </div>
      ) : (
        pageList.map((page) => (
          <Link
            key={page.uuid}
            href={`/page/${page.slug}`}
            className="pages-list-item"
          >
            {page.title}
            <span className="pages-list-item-slug">{page.slug}</span>
          </Link>
        ))
      )}
    </div>
  );
}

export function SinglePageContent({ slug }: { slug: string }) {
  const { data: page, isLoading, error } = usePage(slug);

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="page-content">
        <div className="page-not-found">
          <div className="icon" style={{ fontSize: 40 }}>
            ?
          </div>
          <h2>Page not found</h2>
          <p>The requested page does not exist.</p>
          <Link href="/page" className="back-link">
            &larr; All pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-content-panel">
        {page.title && (
          <h1 className="page-title">{page.title}</h1>
        )}
        <div
          className="page-body"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
        <div className="page-meta">
          <span>Last updated: {formatDate(page.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
