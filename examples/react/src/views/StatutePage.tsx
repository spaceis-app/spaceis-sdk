"use client";

import { useStatute } from "@spaceis/react";
import { sanitizeHtml } from "@/helpers";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function StatutePage() {
  const { data: statute, isLoading } = useStatute();

  if (isLoading) {
    return (
      <div className="statute-content">
        <div className="spinner" />
      </div>
    );
  }

  if (!statute) {
    return (
      <div className="statute-content">
        <div className="empty-state">
          <p>No statute available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statute-content">
      <div className="statute-content-panel">
        {statute.title && (
          <h1 className="statute-title">{statute.title}</h1>
        )}
        <div
          className="statute-body"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(statute.content || "") }}
        />
        <div className="statute-meta">
          <span>Created: {formatDate(statute.created_at)}</span>
          <span>Last updated: {formatDate(statute.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
