import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="page-content">
      <div className="page-not-found">
        <div className="icon" style={{ fontSize: 48 }}>404</div>
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link href="/" className="back-link">
          &larr; Back to shop
        </Link>
      </div>
    </div>
  );
}
