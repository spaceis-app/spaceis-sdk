// examples/vanilla/shared/header.js
// Header + nav + mobile menu + sub-tabs rendering.

// Lazy import to avoid circular dep at module top-level — cart state comes from cart.js
let _toggleCart;
export function setToggleCartCallback(fn) {
  _toggleCart = fn;
}

// Pages that show the shop sub-tabs
export const SHOP_TABS = [
  { href: "index.html", label: "Products", key: "products" },
  { href: "packages.html", label: "Packages", key: "packages" },
  { href: "sales.html", label: "Sales", key: "sales" },
];
export const SHOP_KEYS = SHOP_TABS.map((t) => t.key);

export function renderHeader(activePage) {
  const headerEl = document.getElementById("site-header");
  if (!headerEl) return;

  const shopActive = SHOP_KEYS.includes(activePage);

  const navLinksHtml =
    `<li><a href="index.html"${shopActive ? ' class="active"' : ""}>Shop</a></li>` +
    `<li><a href="voucher.html"${activePage === "voucher" ? ' class="active"' : ""}>Voucher</a></li>` +
    `<li><a href="daily-reward.html"${activePage === "daily-reward" ? ' class="active"' : ""}>Daily Reward</a></li>` +
    `<li><a href="page.html"${activePage === "pages" ? ' class="active"' : ""}>Pages</a></li>` +
    `<li><a href="statute.html"${activePage === "statute" ? ' class="active"' : ""}>Terms</a></li>`;

  headerEl.innerHTML =
    '<div class="container">' +
      '<div class="header-inner">' +
        '<a href="index.html" class="nav-logo">SpaceIS</a>' +
        `<ul class="nav-links">${navLinksHtml}</ul>` +
        '<div class="header-actions">' +
          '<button class="btn-cart-icon" id="cart-btn-header" aria-label="Cart">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
              '<line x1="3" y1="6" x2="21" y2="6"/>' +
              '<path d="M16 10a4 4 0 01-8 0"/>' +
            '</svg>' +
            '<span class="cart-badge-dot" id="cart-badge"></span>' +
          '</button>' +
          '<button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">' +
            '<span class="hamburger-line"></span>' +
            '<span class="hamburger-line"></span>' +
            '<span class="hamburger-line"></span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Append overlay and mobile menu directly to body so they cover the full page
  const overlay = document.createElement("div");
  overlay.className = "mobile-menu-overlay";
  overlay.id = "mobile-menu-overlay";
  document.body.appendChild(overlay);

  const mobileNav = document.createElement("nav");
  mobileNav.className = "mobile-menu";
  mobileNav.id = "mobile-menu";
  mobileNav.innerHTML = `<ul class="mobile-menu-links">${navLinksHtml}</ul>`;
  document.body.appendChild(mobileNav);

  // Sub-tabs for shop pages
  if (shopActive) {
    const tabsHtml = SHOP_TABS.map((tab) => {
      const isActive = tab.key === activePage;
      return `<a href="${tab.href}" class="sub-tab${isActive ? " active" : ""}">${tab.label}</a>`;
    }).join("");

    const subBar = document.createElement("div");
    subBar.className = "sub-tabs-bar";
    subBar.innerHTML = `<div class="container"><div class="sub-tabs">${tabsHtml}</div></div>`;
    headerEl.appendChild(subBar);
  }

  document.getElementById("cart-btn-header").addEventListener("click", () => {
    if (_toggleCart) _toggleCart();
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileOverlay = document.getElementById("mobile-menu-overlay");

  const openMobileMenu = () => {
    mobileMenuBtn.classList.add("active");
    mobileMenu.classList.add("open");
    mobileOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeMobileMenu = () => {
    mobileMenuBtn.classList.remove("active");
    mobileMenu.classList.remove("open");
    mobileOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  mobileMenuBtn.addEventListener("click", () => {
    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileOverlay.addEventListener("click", () => {
    closeMobileMenu();
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });
}
