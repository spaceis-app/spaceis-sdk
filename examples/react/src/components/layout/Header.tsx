"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@spaceis/react";
import { useCartDrawer } from "@/features/cart/cart-drawer-context";

const SHOP_PAGES = ["/", "/packages", "/sales"];

const SHOP_TABS = [
  { href: "/", label: "Products" },
  { href: "/packages", label: "Packages" },
  { href: "/sales", label: "Sales" },
];

const NAV_LINKS = [
  { href: "/", label: "Shop", matchPaths: SHOP_PAGES },
  { href: "/voucher", label: "Voucher" },
  { href: "/daily-reward", label: "Daily Reward" },
  { href: "/page", label: "Pages" },
  { href: "/statute", label: "Terms" },
];

export function Header() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { toggle } = useCartDrawer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isShopPage = SHOP_PAGES.includes(pathname);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen((p) => !p);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="nav-logo">
              SpaceIS
            </Link>

            <ul className="nav-links">
              {NAV_LINKS.map((link) => {
                const isActive = link.matchPaths
                  ? link.matchPaths.includes(pathname)
                  : pathname === link.href ||
                    pathname.startsWith(link.href + "/");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={isActive ? "active" : ""}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="header-actions">
              <button
                className="btn-cart-icon"
                onClick={toggle}
                aria-label="Cart"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span
                  className={`cart-badge-dot ${totalQuantity > 0 ? "visible" : ""}`}
                >
                  {totalQuantity > 0 ? totalQuantity : ""}
                </span>
              </button>

              <button
                className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
                onClick={toggleMobileMenu}
                aria-label="Menu"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            </div>
          </div>
        </div>

        {/* Shop sub-tabs */}
        {isShopPage && (
          <div className="sub-tabs-bar">
            <div className="container">
              <div className="sub-tabs">
                {SHOP_TABS.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`sub-tab ${pathname === tab.href ? "active" : ""}`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile overlay + menu portaled to body to escape header stacking context */}
      {mounted &&
        createPortal(
          <>
            <div
              className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`}
              onClick={closeMobileMenu}
            />
            <nav className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <ul className="mobile-menu-links">
                {NAV_LINKS.map((link) => {
                  const isActive = link.matchPaths
                    ? link.matchPaths.includes(pathname)
                    : pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={isActive ? "active" : ""}
                        onClick={closeMobileMenu}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>,
          document.body
        )}
    </>
  );
}
