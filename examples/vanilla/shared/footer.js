// examples/vanilla/shared/footer.js
// Footer rendering with SDK version.

export function renderFooter() {
  const footerEl = document.getElementById("site-footer");
  if (!footerEl) return;
  footerEl.className = "site-footer";
  footerEl.innerHTML =
    '<div class="container">' +
      // TODO: replace with SpaceIS.VERSION when exposed by SDK (tracked separately)
      '<span class="footer-text">Powered by <strong>SpaceIS SDK</strong> v0.2.0</span>' +
    '</div>';
}
